from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import jwt

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.redis_bus import event_bus
from shared.models import PostCreate, CommentCreate

security = HTTPBearer()

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await event_bus.connect()
    yield
    await close_mongo_connection()
    await event_bus.disconnect()

app = FastAPI(title="Post & Feed Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "post_service"}

@app.get("/posts")
async def get_feed(limit: int = 30, skip: int = 0):
    db = get_database()
    cursor = db.posts.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = []
    async for doc in cursor:
        posts.append({
            "id": str(doc["_id"]),
            "author_id": doc["author_id"],
            "author_username": doc["author_username"],
            "author_avatar": doc.get("author_avatar"),
            "content": doc["content"],
            "media_url": doc.get("media_url"),
            "likes_count": len(doc.get("liked_by", [])),
            "comments_count": doc.get("comments_count", 0),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"])
        })
    return {"posts": posts}

@app.post("/posts")
async def create_post(
    post_in: PostCreate,
    user: dict = Depends(get_current_user_payload)
):
    db = get_database()
    user_id = user["sub"]
    username = user["username"]

    post_doc = {
        "author_id": user_id,
        "author_username": username,
        "author_avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
        "content": post_in.content,
        "media_url": post_in.media_url,
        "liked_by": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.posts.insert_one(post_doc)
    post_id = str(result.inserted_id)

    post_response = {
        "id": post_id,
        "author_id": user_id,
        "author_username": username,
        "author_avatar": post_doc["author_avatar"],
        "content": post_in.content,
        "media_url": post_in.media_url,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": post_doc["created_at"].isoformat()
    }

    # Broadcast event to Redis channel:feed -> Gateway will push to all connected users
    await event_bus.publish("channel:feed", {
        "topic": "feed",
        "event": "POST_CREATED",
        "data": post_response
    })

    return post_response

@app.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    user: dict = Depends(get_current_user_payload)
):
    db = get_database()
    user_id = user["sub"]
    username = user["username"]

    try:
        obj_id = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await db.posts.find_one({"_id": obj_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    liked_by = post.get("liked_by", [])
    if user_id in liked_by:
        # Unlike
        await db.posts.update_one({"_id": obj_id}, {"$pull": {"liked_by": user_id}})
        is_liked = False
        new_count = max(0, len(liked_by) - 1)
    else:
        # Like
        await db.posts.update_one({"_id": obj_id}, {"$addToSet": {"liked_by": user_id}})
        is_liked = True
        new_count = len(liked_by) + 1

    payload = {
        "post_id": post_id,
        "likes_count": new_count,
        "user_id": user_id,
        "username": username,
        "is_liked": is_liked
    }

    # Broadcast real-time update to feed and specific post topic
    await event_bus.publish("channel:feed", {
        "topic": "feed",
        "event": "POST_LIKED",
        "data": payload
    })
    await event_bus.publish(f"channel:post:{post_id}", {
        "topic": f"post:{post_id}",
        "event": "POST_LIKED",
        "data": payload
    })

    # If it was a like, publish an internal event for notification service
    if is_liked and post["author_id"] != user_id:
        await event_bus.publish("channel:notifications_worker", {
            "type": "LIKE",
            "actor_id": user_id,
            "actor_username": username,
            "recipient_id": post["author_id"],
            "post_id": post_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    return {"status": "ok", "is_liked": is_liked, "likes_count": new_count}

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    db = get_database()
    cursor = db.comments.find({"post_id": post_id}).sort("created_at", 1)
    comments = []
    async for doc in cursor:
        comments.append({
            "id": str(doc["_id"]),
            "post_id": doc["post_id"],
            "author_id": doc["author_id"],
            "author_username": doc["author_username"],
            "content": doc["content"],
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"])
        })
    return {"comments": comments}

@app.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment_in: CommentCreate,
    user: dict = Depends(get_current_user_payload)
):
    db = get_database()
    user_id = user["sub"]
    username = user["username"]

    try:
        obj_id = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await db.posts.find_one({"_id": obj_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_username": username,
        "content": comment_in.content,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.comments.insert_one(comment_doc)
    comment_id = str(result.inserted_id)

    # Increment comments_count on post
    await db.posts.update_one({"_id": obj_id}, {"$inc": {"comments_count": 1}})

    comment_data = {
        "id": comment_id,
        "post_id": post_id,
        "author_id": user_id,
        "author_username": username,
        "content": comment_in.content,
        "created_at": comment_doc["created_at"].isoformat()
    }

    # Broadcast to post comments topic and feed
    await event_bus.publish(f"channel:post:{post_id}", {
        "topic": f"post:{post_id}",
        "event": "COMMENT_ADDED",
        "data": comment_data
    })
    await event_bus.publish("channel:feed", {
        "topic": "feed",
        "event": "COMMENT_COUNT_UPDATED",
        "data": {"post_id": post_id, "delta": 1}
    })

    return comment_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.POST_SERVICE_PORT, reload=True)
