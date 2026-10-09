import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.redis_bus import event_bus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notification_service")

async def notification_worker():
    """Worker task that consumes internal notification events and dispatches to users"""
    logger.info("Notification worker listening on channel:notifications_worker...")
    while True:
        try:
            if not event_bus.redis_client:
                await event_bus.connect()

            pubsub = event_bus.redis_client.pubsub()
            await pubsub.subscribe("channel:notifications_worker")

            async for raw in pubsub.listen():
                if raw["type"] == "message":
                    event = json.loads(raw["data"])
                    db = get_database()
                    
                    doc = {
                        "recipient_id": event["recipient_id"],
                        "actor_id": event["actor_id"],
                        "actor_username": event["actor_username"],
                        "type": event["type"],
                        "post_id": event.get("post_id"),
                        "read": False,
                        "created_at": datetime.now(timezone.utc)
                    }
                    result = await db.notifications.insert_one(doc)
                    doc["id"] = str(result.inserted_id)
                    doc["created_at"] = doc["created_at"].isoformat()
                    del doc["_id"]

                    # Push real-time notification to user's personal topic
                    user_topic = f"user:{event['recipient_id']}"
                    await event_bus.publish(f"channel:{user_topic}", {
                        "topic": user_topic,
                        "event": "NEW_NOTIFICATION",
                        "data": doc
                    })
                    logger.info(f"Dispatched notification to {user_topic}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Notification worker error: {e}. Retrying in 2 seconds...")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await event_bus.connect()
    worker_task = asyncio.create_task(notification_worker())
    yield
    worker_task.cancel()
    await close_mongo_connection()
    await event_bus.disconnect()

app = FastAPI(title="Notification Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notification_service"}

@app.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str, filter: Optional[str] = None):
    db = get_database()
    query = {"recipient_id": user_id}
    if filter:
        f = filter.strip().lower()
        if f == "follows":
            query["type"] = {"$in": ["FOLLOW", "FOLLOW_REQUEST", "FOLLOW_ACCEPTED"]}
        elif f == "likes":
            query["type"] = {"$in": ["LIKE", "REPOST"]}
        elif f == "comments":
            query["type"] = {"$in": ["COMMENT", "REPLY", "MENTION"]}

    cursor = db.notifications.find(query).sort("created_at", -1).limit(50)
    notifications = []
    async for doc in cursor:
        post_media = None
        if doc.get("post_id"):
            try:
                from bson import ObjectId
                post = await db.posts.find_one({"_id": ObjectId(str(doc["post_id"]))})
                if not post:
                    post = await db.posts.find_one({"id": str(doc["post_id"])})
                if post:
                    post_media = post.get("media_url") or (post.get("media_urls")[0] if post.get("media_urls") else None)
            except Exception:
                pass

        # Resolve the actor's current profile info (avatar) the same way the
        # feed resolves post authors: try the id lookup, fall back to a
        # username lookup, and keep the notification's stored avatar when the
        # live user record has no avatar_url — so the screen always shows the
        # real image (or the default empty avatar).
        actor = None
        if doc.get("actor_id"):
            try:
                from bson import ObjectId
                actor = await db.users.find_one({"_id": ObjectId(str(doc["actor_id"]))})
            except Exception:
                actor = None
            if not actor:
                try:
                    actor = await db.users.find_one({"id": str(doc["actor_id"])})
                except Exception:
                    actor = None
        if not actor and doc.get("actor_username"):
            try:
                actor = await db.users.find_one({"username": doc["actor_username"]})
            except Exception:
                actor = None

        actor_avatar = doc.get("actor_avatar") or None
        actor_full_name = doc.get("actor_fullName") or None
        if actor:
            if actor.get("full_name"):
                actor_full_name = actor["full_name"]
            if actor.get("avatar_url"):
                actor_avatar = actor["avatar_url"]

        is_following = False
        if doc.get("actor_username"):
            try:
                follows = await db.follows.find_one({
                    "follower_id": str(user_id),
                    "target_username": doc["actor_username"],
                })
                is_following = follows is not None
            except Exception:
                is_following = False

        notifications.append({
            "id": str(doc["_id"]),
            "recipient_id": doc["recipient_id"],
            "actor_id": doc["actor_id"],
            "actor_username": doc["actor_username"],
            "actor_fullName": actor_full_name,
            "actor_avatar": actor_avatar,
            "is_following": is_following,
            "type": doc["type"],
            "post_id": doc.get("post_id"),
            "post_media_url": post_media,
            "read": doc.get("read", False),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"])
        })
    return {"notifications": notifications}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.NOTIFICATION_SERVICE_PORT, reload=True)
