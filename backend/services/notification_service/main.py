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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notification_service"}

@app.get("/notifications/{user_id}")
async def get_user_notifications(user_id: str):
    db = get_database()
    cursor = db.notifications.find({"recipient_id": user_id}).sort("created_at", -1).limit(50)
    notifications = []
    async for doc in cursor:
        notifications.append({
            "id": str(doc["_id"]),
            "recipient_id": doc["recipient_id"],
            "actor_id": doc["actor_id"],
            "actor_username": doc["actor_username"],
            "type": doc["type"],
            "post_id": doc.get("post_id"),
            "read": doc.get("read", False),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"])
        })
    return {"notifications": notifications}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.NOTIFICATION_SERVICE_PORT, reload=True)
