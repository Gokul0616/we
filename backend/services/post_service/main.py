import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import jwt

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.redis_bus import event_bus
from shared.models import PostCreate, CommentCreate

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadPayload(BaseModel):
    data: str  # Base64 data or URI
    filename: Optional[str] = None
    media_type: Optional[str] = "image/jpeg"

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

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "post_service"}

async def enrich_posts_with_author_info(posts: list[dict], db):
    if not posts:
        return posts
    user_identifiers = set()
    for p in posts:
        if p.get("author_id"):
            user_identifiers.add(p["author_id"])
        if p.get("author_username"):
            user_identifiers.add(p["author_username"])

    if not user_identifiers:
        return posts

    obj_ids = []
    str_ids = []
    for uid in user_identifiers:
        try:
            obj_ids.append(ObjectId(uid))
        except Exception:
            pass
        str_ids.append(uid)

    try:
        users = await db.users.find({"$or": [{"_id": {"$in": obj_ids}}, {"username": {"$in": str_ids}}]}).to_list(100)
        user_map = {}
        for u in users:
            u_id = str(u["_id"])
            u_name = u.get("username", "")
            user_map[u_id] = u
            if u_name:
                user_map[u_name] = u

        for p in posts:
            matched_user = user_map.get(str(p.get("author_id", ""))) or user_map.get(p.get("author_username", ""))
            if matched_user:
                if matched_user.get("avatar_url"):
                    p["author_avatar"] = matched_user["avatar_url"]
                if matched_user.get("full_name"):
                    p["author_fullName"] = matched_user["full_name"]
    except Exception as e:
        pass
    return posts

@app.get("/posts")
async def get_feed(limit: int = 30, skip: int = 0, author_username: Optional[str] = None, author_id: Optional[str] = None):
    db = get_database()
    query = {}
    if author_username:
        query["author_username"] = author_username
    elif author_id:
        query["author_id"] = author_id

    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = []
    async for doc in cursor:
        posts.append({
            "id": str(doc["_id"]),
            "author_id": doc.get("author_id"),
            "author_username": doc.get("author_username", "anonymous"),
            "author_fullName": doc.get("author_fullName") or doc.get("author_username", "User"),
            "author_avatar": doc.get("author_avatar"),
            "content": doc.get("content", ""),
            "media_url": doc.get("media_url"),
            "media_urls": doc.get("media_urls", [doc["media_url"]] if doc.get("media_url") else []),
            "media_type": doc.get("media_type", "photo"),
            "location": doc.get("location"),
            "tags": doc.get("tags", []),
            "labels": doc.get("labels", []),
            "privacy": doc.get("privacy", "public"),
            "add_to_story": doc.get("add_to_story", False),
            "likes_count": len(doc.get("liked_by", [])),
            "comments_count": doc.get("comments_count", 0),
            "created_at": doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else str(doc.get("created_at"))
        })
    posts = await enrich_posts_with_author_info(posts, db)
    return {"posts": posts}

@app.get("/posts/user/{identifier}")
async def get_user_posts(identifier: str, tab: str = "posts", limit: int = 40, skip: int = 0):
    db = get_database()
    # Check if identifier matches username or author_id
    query = {"$or": [{"author_username": identifier}, {"author_id": identifier}]}

    if tab == "media":
        query = {
            "$and": [
                {"$or": [{"author_username": identifier}, {"author_id": identifier}]},
                {"$or": [{"media_url": {"$ne": None}}, {"media_urls": {"$not": {"$size": 0}}}]}
            ]
        }
    elif tab == "likes":
        # Posts liked by this user
        user_ids = [identifier]
        user_doc = None
        try:
            user_doc = await db.users.find_one({"_id": ObjectId(identifier)})
        except Exception:
            pass
        if not user_doc:
            user_doc = await db.users.find_one({"username": identifier})
        if user_doc:
            user_ids.extend([str(user_doc["_id"]), user_doc.get("username", "")])
        user_ids = list(set([u for u in user_ids if u]))
        query = {
            "$and": [
                {"liked_by": {"$in": user_ids}},
                {"author_username": {"$nin": user_ids}},
                {"author_id": {"$nin": user_ids}}
            ]
        }
    elif tab == "replies":
        user_ids = [identifier]
        user_doc = None
        try:
            user_doc = await db.users.find_one({"_id": ObjectId(identifier)})
        except Exception:
            pass
        if not user_doc:
            user_doc = await db.users.find_one({"username": identifier})
        if user_doc:
            user_ids.extend([str(user_doc["_id"]), user_doc.get("username", "")])
        user_ids = list(set([u for u in user_ids if u]))

        # Find comments by this user
        comments_cursor = db.comments.find({"$or": [{"author_username": {"$in": user_ids}}, {"author_id": {"$in": user_ids}}]}).limit(40)
        post_ids = []
        valid_obj_ids = []
        async for c in comments_cursor:
            pid = c.get("post_id")
            if pid:
                post_ids.append(str(pid))
                try:
                    valid_obj_ids.append(ObjectId(pid))
                except Exception:
                    pass

        # Exclude own posts (replies tab should only show conversations/replies on other users' posts)
        all_match_ids = valid_obj_ids + post_ids
        if all_match_ids:
            query = {
                "$and": [
                    {"$or": [{"_id": {"$in": all_match_ids}}, {"id": {"$in": post_ids}}]},
                    {"author_username": {"$nin": user_ids}},
                    {"author_id": {"$nin": user_ids}}
                ]
            }
        else:
            query = {"_id": {"$in": []}}

    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = []
    async for doc in cursor:
        posts.append({
            "id": str(doc["_id"]),
            "author_id": doc.get("author_id"),
            "author_username": doc.get("author_username", "anonymous"),
            "author_fullName": doc.get("author_fullName") or doc.get("author_username", "User"),
            "author_avatar": doc.get("author_avatar"),
            "content": doc.get("content", ""),
            "media_url": doc.get("media_url"),
            "media_urls": doc.get("media_urls", [doc["media_url"]] if doc.get("media_url") else []),
            "media_type": doc.get("media_type", "photo"),
            "location": doc.get("location"),
            "tags": doc.get("tags", []),
            "labels": doc.get("labels", []),
            "privacy": doc.get("privacy", "public"),
            "add_to_story": doc.get("add_to_story", False),
            "likes_count": len(doc.get("liked_by", [])),
            "comments_count": doc.get("comments_count", 0),
            "created_at": doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else str(doc.get("created_at"))
        })
    posts = await enrich_posts_with_author_info(posts, db)
    return {"posts": posts}

@app.post("/upload")
async def upload_media(request: Request):
    content_type = request.headers.get("content-type", "")
    host = request.headers.get("host") or "192.168.1.83:8002"
    proto = request.headers.get("x-forwarded-proto", request.url.scheme or "http")

    # 1. Multipart Form Data (Mobile FormData / Web File uploads)
    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if not uploaded_file:
            raise HTTPException(status_code=400, detail="No file uploaded")

        orig_name = getattr(uploaded_file, "filename", "media.jpg")
        ext = os.path.splitext(orig_name)[1].lower().lstrip(".")
        if not ext:
            mime = getattr(uploaded_file, "content_type", "")
            if "video" in mime or "mp4" in mime:
                ext = "mp4"
            elif "mov" in mime:
                ext = "mov"
            elif "png" in mime:
                ext = "png"
            else:
                ext = "jpg"

        filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        file_bytes = await uploaded_file.read()
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        file_url = f"{proto}://{host}/uploads/{filename}"
        return {"url": file_url, "filename": filename, "status": "ok"}

    # 2. JSON Payload (base64 or direct URL)
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    data = payload.get("data", "")
    media_type = payload.get("media_type", "image/jpeg")

    # If it's already a http/https URL, return it
    if data.startswith("http://") or data.startswith("https://"):
        return {"url": data, "status": "ok"}

    ext = "jpg"
    if "png" in media_type:
        ext = "png"
    elif "mp4" in media_type or "video" in media_type:
        ext = "mp4"
    elif "mov" in media_type:
        ext = "mov"

    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        raw_data = data
        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]
        import base64
        file_bytes = base64.b64decode(raw_data)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        file_url = f"{proto}://{host}/uploads/{filename}"
        return {"url": file_url, "filename": filename, "status": "ok"}
    except Exception:
        # Fallback to returning raw data URI
        return {"url": data, "status": "ok"}

@app.post("/posts")
async def create_post(
    post_in: PostCreate,
    user: dict = Depends(get_current_user_payload)
):
    db = get_database()
    user_id = user["sub"]
    username = user["username"]

    author_avatar = None
    author_fullName = username
    try:
        user_doc = None
        if ObjectId.is_valid(user_id):
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            user_doc = await db.users.find_one({"username": username})
        if user_doc:
            author_avatar = user_doc.get("avatar_url")
            author_fullName = user_doc.get("full_name") or username
    except Exception:
        pass

    if not author_avatar:
        author_avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"

    primary_media = post_in.media_url
    if not primary_media and post_in.media_urls and len(post_in.media_urls) > 0:
        primary_media = post_in.media_urls[0]

    post_doc = {
        "author_id": user_id,
        "author_username": username,
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
        "content": post_in.content,
        "media_url": primary_media,
        "media_urls": post_in.media_urls or ([primary_media] if primary_media else []),
        "media_type": post_in.media_type or "photo",
        "location": post_in.location,
        "tags": post_in.tags or [],
        "labels": post_in.labels or [],
        "privacy": post_in.privacy or "public",
        "add_to_story": post_in.add_to_story or False,
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
        "author_fullName": author_fullName,
        "author_avatar": post_doc["author_avatar"],
        "content": post_in.content,
        "media_url": primary_media,
        "media_urls": post_doc["media_urls"],
        "media_type": post_doc["media_type"],
        "location": post_doc["location"],
        "tags": post_doc["tags"],
        "labels": post_doc["labels"],
        "privacy": post_doc["privacy"],
        "add_to_story": post_doc["add_to_story"],
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

    # Also notify current user in notification service
    await event_bus.publish("channel:notifications_worker", {
        "type": "SYSTEM",
        "actor_id": user_id,
        "actor_username": username,
        "recipient_id": user_id,
        "post_id": post_id,
        "title": "Post Published!",
        "message": f"Your post '{post_in.content[:30]}...' is now live.",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return post_response

@app.get("/posts/{post_id}")
async def get_post_by_id(post_id: str):
    db = get_database()
    post = None
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        pass
    
    if not post:
        post = await db.posts.find_one({"id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    author_avatar = post.get("author_avatar")
    author_fullName = post.get("author_fullName") or post.get("author_username", "User")
    try:
        author_user = None
        if post.get("author_id") and ObjectId.is_valid(post["author_id"]):
            author_user = await db.users.find_one({"_id": ObjectId(post["author_id"])})
        if not author_user and post.get("author_username"):
            author_user = await db.users.find_one({"username": post["author_username"]})
        if author_user:
            if author_user.get("avatar_url"):
                author_avatar = author_user["avatar_url"]
            if author_user.get("full_name"):
                author_fullName = author_user["full_name"]
    except Exception:
        pass

    return {
        "id": str(post.get("_id", post.get("id"))),
        "author_id": post.get("author_id"),
        "author_username": post.get("author_username", "anonymous"),
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
        "content": post.get("content", ""),
        "media_url": post.get("media_url"),
        "media_urls": post.get("media_urls", [post["media_url"]] if post.get("media_url") else []),
        "media_type": post.get("media_type", "photo"),
        "location": post.get("location"),
        "tags": post.get("tags", []),
        "labels": post.get("labels", []),
        "privacy": post.get("privacy", "public"),
        "add_to_story": post.get("add_to_story", False),
        "likes_count": len(post.get("liked_by", [])),
        "comments_count": post.get("comments_count", 0),
        "created_at": post["created_at"].isoformat() if isinstance(post.get("created_at"), datetime) else str(post.get("created_at"))
    }

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
    user_identifiers = set()
    async for doc in cursor:
        c_item = {
            "id": str(doc["_id"]),
            "post_id": doc["post_id"],
            "author_id": doc.get("author_id"),
            "author_username": doc.get("author_username", "anonymous"),
            "author_fullName": doc.get("author_fullName") or doc.get("author_username", "User"),
            "author_avatar": doc.get("author_avatar"),
            "content": doc.get("content", ""),
            "created_at": doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else str(doc.get("created_at"))
        }
        if c_item["author_id"]:
            user_identifiers.add(c_item["author_id"])
        if c_item["author_username"]:
            user_identifiers.add(c_item["author_username"])
        comments.append(c_item)

    if user_identifiers:
        try:
            obj_ids = [ObjectId(uid) for uid in user_identifiers if ObjectId.is_valid(uid)]
            str_ids = list(user_identifiers)
            users = await db.users.find({"$or": [{"_id": {"$in": obj_ids}}, {"username": {"$in": str_ids}}]}).to_list(100)
            u_map = {}
            for u in users:
                u_map[str(u["_id"])] = u
                if u.get("username"):
                    u_map[u["username"]] = u
            for c in comments:
                matched = u_map.get(str(c.get("author_id", ""))) or u_map.get(c.get("author_username", ""))
                if matched:
                    if matched.get("avatar_url"):
                        c["author_avatar"] = matched["avatar_url"]
                    if matched.get("full_name"):
                        c["author_fullName"] = matched["full_name"]
        except Exception:
            pass

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

    author_avatar = None
    author_fullName = username
    try:
        user_doc = None
        if ObjectId.is_valid(user_id):
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            user_doc = await db.users.find_one({"username": username})
        if user_doc:
            author_avatar = user_doc.get("avatar_url")
            author_fullName = user_doc.get("full_name") or username
    except Exception:
        pass

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
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
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
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
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
