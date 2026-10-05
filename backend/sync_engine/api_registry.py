from datetime import datetime, timezone
from typing import Any
from .engine import sync_engine, QueryContext, MutationContext

# ==========================================
# QUERIES (Pure, Deterministic, Reactive)
# ==========================================

@sync_engine.query("posts:getFeed")
async def get_feed(ctx: QueryContext, args: dict[str, Any]):
    limit = args.get("limit", 30)
    # The reader automatically tracks Read Set (coll:posts, doc:posts:id)
    posts = await ctx.db.find("posts", {}, sort_field="created_at", sort_order=-1, limit=limit)
    
    current_user_id = ctx.auth_user.get("sub") if ctx.auth_user else None
    for p in posts:
        liked_by = p.get("liked_by", [])
        p["likes_count"] = len(liked_by)
        p["is_liked"] = current_user_id in liked_by if current_user_id else False
        p["comments_count"] = p.get("comments_count", 0)
        if "liked_by" in p:
            del p["liked_by"]
    return posts

@sync_engine.query("posts:getPost")
async def get_post(ctx: QueryContext, args: dict[str, Any]):
    post_id = args.get("postId")
    if not post_id:
        return None
    post = await ctx.db.get("posts", post_id)
    if post:
        liked_by = post.get("liked_by", [])
        post["likes_count"] = len(liked_by)
        current_user_id = ctx.auth_user.get("sub") if ctx.auth_user else None
        post["is_liked"] = current_user_id in liked_by if current_user_id else False
    return post

@sync_engine.query("posts:getComments")
async def get_comments(ctx: QueryContext, args: dict[str, Any]):
    post_id = args.get("postId")
    if not post_id:
        return []
    comments = await ctx.db.find("comments", {"post_id": post_id}, sort_field="created_at", sort_order=1)
    return comments

@sync_engine.query("users:getProfile")
async def get_profile(ctx: QueryContext, args: dict[str, Any]):
    user_id = args.get("userId")
    if not user_id:
        return None
    user = await ctx.db.get("users", user_id)
    if user:
        if "password_hash" in user:
            del user["password_hash"]
    return user

@sync_engine.query("notifications:list")
async def list_notifications(ctx: QueryContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return []
    user_id = ctx.auth_user["sub"]
    return await ctx.db.find("notifications", {"recipient_id": user_id}, sort_field="created_at", sort_order=-1, limit=30)

@sync_engine.query("users:checkUsername")
async def check_username_query(ctx: QueryContext, args: dict[str, Any]):
    username = args.get("username", "").strip().lower()
    if len(username) < 3:
        return {"available": False, "exists": False, "message": "Username must be at least 3 characters"}
    users = await ctx.db.find("users", {"username": username}, limit=1)
    if users:
        u = users[0]
        return {
            "available": False,
            "exists": True,
            "username": username,
            "message": f"@{username} is already taken",
            "user": {
                "username": u.get("username"),
                "full_name": u.get("full_name"),
                "avatar_url": u.get("avatar_url"),
            }
        }
    return {
        "available": True,
        "exists": False,
        "username": username,
        "message": f"@{username} is available"
    }

# ==========================================
# MUTATIONS (Transactional, Modifies DB)
# ==========================================

@sync_engine.mutation("posts:create")
async def create_post(ctx: MutationContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else "guest_user"
    username = ctx.auth_user.get("username", "guest_user") if ctx.auth_user else "guest_user"

    post_doc = {
        "author_id": user_id,
        "author_username": username,
        "author_avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
        "content": args["content"],
        "media_url": args.get("media_url"),
        "liked_by": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc)
    }

    # Automatically records Write Set for coll:posts and doc:posts:<id>
    doc_id = await ctx.db.insert("posts", post_doc)
    post_doc["id"] = doc_id
    return post_doc

@sync_engine.mutation("posts:like")
async def toggle_like(ctx: MutationContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else "guest_user"
    username = ctx.auth_user.get("username", "guest_user") if ctx.auth_user else "guest_user"

    post_id = args["postId"]

    post = await ctx.reader.get("posts", post_id)
    if not post:
        raise ValueError("Post not found")

    liked_by = post.get("liked_by", [])
    if user_id in liked_by:
        # Unlike
        await ctx.db.update("posts", post_id, {"$pull": {"liked_by": user_id}})
        is_liked = False
        new_count = max(0, len(liked_by) - 1)
    else:
        # Like
        await ctx.db.update("posts", post_id, {"$addToSet": {"liked_by": user_id}})
        is_liked = True
        new_count = len(liked_by) + 1

        # Also create notification if not self-like
        if post.get("author_id") and post["author_id"] != user_id:
            await ctx.db.insert("notifications", {
                "recipient_id": post["author_id"],
                "actor_id": user_id,
                "actor_username": username,
                "type": "LIKE",
                "post_id": post_id,
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })

    return {"postId": post_id, "isLiked": is_liked, "likesCount": new_count}

@sync_engine.mutation("posts:addComment")
async def add_comment(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        raise PermissionError("Authentication required")

    post_id = args["postId"]
    user_id = ctx.auth_user["sub"]
    username = ctx.auth_user.get("username", "anonymous")
    content = args["content"]

    comment_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_username": username,
        "content": content,
        "created_at": datetime.now(timezone.utc)
    }

    comment_id = await ctx.db.insert("comments", comment_doc)
    # Increment post's comment count
    await ctx.db.update("posts", post_id, {"$inc": {"comments_count": 1}})

    comment_doc["id"] = comment_id
    return comment_doc
