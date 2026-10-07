from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from .engine import sync_engine, QueryContext, MutationContext

async def enrich_sync_posts(ctx: QueryContext, posts: list[dict]):
    for p in posts:
        aid = p.get("author_id")
        auser = p.get("author_username")
        user = None
        if aid:
            try:
                user = await ctx.reader.get("users", aid)
            except Exception:
                pass
        if not user and auser:
            try:
                u_list = await ctx.db.find("users", {"username": auser}, limit=1)
                user = u_list[0] if u_list else None
            except Exception:
                pass
        if user:
            if user.get("avatar_url"):
                p["author_avatar"] = user["avatar_url"]
            if user.get("full_name"):
                p["author_fullName"] = user["full_name"]
    return posts

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
        p["media_urls"] = p.get("media_urls", [p["media_url"]] if p.get("media_url") else [])
        if "liked_by" in p:
            del p["liked_by"]
    posts = await enrich_sync_posts(ctx, posts)
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
        post["media_urls"] = post.get("media_urls", [post["media_url"]] if post.get("media_url") else [])
        aid = post.get("author_id")
        auser = post.get("author_username")
        user = None
        if aid:
            try:
                user = await ctx.reader.get("users", aid)
            except Exception:
                pass
        if not user and auser:
            try:
                u_list = await ctx.db.find("users", {"username": auser}, limit=1)
                user = u_list[0] if u_list else None
            except Exception:
                pass
        if user:
            if user.get("avatar_url"):
                post["author_avatar"] = user["avatar_url"]
            if user.get("full_name"):
                post["author_fullName"] = user["full_name"]
    return post

@sync_engine.query("posts:getComments")
async def get_comments(ctx: QueryContext, args: dict[str, Any]):
    post_id = args.get("postId")
    if not post_id:
        return []
    comments = await ctx.db.find("comments", {"post_id": post_id}, sort_field="created_at", sort_order=1)
    for c in comments:
        aid = c.get("author_id")
        auser = c.get("author_username")
        user = None
        if aid:
            try:
                user = await ctx.reader.get("users", aid)
            except Exception:
                pass
        if not user and auser:
            try:
                u_list = await ctx.db.find("users", {"username": auser}, limit=1)
                user = u_list[0] if u_list else None
            except Exception:
                pass
        if user:
            if user.get("avatar_url"):
                c["author_avatar"] = user["avatar_url"]
            if user.get("full_name"):
                c["author_fullName"] = user["full_name"]
    return comments

@sync_engine.query("users:getProfile")
async def get_profile(ctx: QueryContext, args: dict[str, Any]):
    user_id = args.get("userId")
    username = args.get("username")
    if not user_id and not username:
        if ctx.auth_user and ctx.auth_user.get("sub"):
            user_id = ctx.auth_user["sub"]
        else:
            return None

    if user_id:
        user = await ctx.db.get("users", user_id)
    else:
        users = await ctx.db.find("users", {"username": username}, limit=1)
        user = users[0] if users else None

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

@sync_engine.query("posts:getUserPosts")
async def get_user_posts(ctx: QueryContext, args: dict[str, Any]):
    user_id = args.get("userId")
    username = args.get("username")
    tab = args.get("tab", "posts")
    limit = args.get("limit", 40)

    query = {}
    if user_id:
        query = {"author_id": user_id}
    elif username:
        query = {"author_username": username}
    else:
        current_id = ctx.auth_user.get("sub") if ctx.auth_user else None
        if current_id:
            query = {"author_id": current_id}

    if tab == "media":
        query["$or"] = [
            {"media_url": {"$ne": None}},
            {"media_urls": {"$not": {"$size": 0}}}
        ]
    elif tab == "likes":
        user_ids = []
        if user_id:
            user_ids.append(user_id)
        if username:
            user_ids.append(username)
            users_found = await ctx.db.find("users", {"username": username}, limit=1)
            if users_found:
                user_ids.append(str(users_found[0].get("id", users_found[0].get("_id", ""))))
        if ctx.auth_user:
            if ctx.auth_user.get("sub"):
                user_ids.append(ctx.auth_user["sub"])
            if ctx.auth_user.get("username"):
                user_ids.append(ctx.auth_user["username"])
        user_ids = list(set([u for u in user_ids if u]))
        query = {
            "$and": [
                {"liked_by": {"$in": user_ids}},
                {"author_id": {"$nin": user_ids}},
                {"author_username": {"$nin": user_ids}}
            ]
        } if user_ids else {"liked_by": "__no_user__"}
    elif tab == "replies":
        user_ids = []
        if user_id:
            user_ids.append(user_id)
        if username:
            user_ids.append(username)
        if ctx.auth_user:
            if ctx.auth_user.get("sub"):
                user_ids.append(ctx.auth_user["sub"])
            if ctx.auth_user.get("username"):
                user_ids.append(ctx.auth_user["username"])
        user_ids = list(set([u for u in user_ids if u]))
        comments = await ctx.db.find(
            "comments",
            {"$or": [{"author_id": {"$in": user_ids}}, {"author_username": {"$in": user_ids}}]},
            limit=40
        )
        post_ids = [str(c["post_id"]) for c in comments if c.get("post_id")]
        valid_obj_ids = []
        for pid in post_ids:
            try:
                valid_obj_ids.append(ObjectId(pid))
            except Exception:
                pass
        all_match_ids = valid_obj_ids + post_ids
        query = {
            "$and": [
                {"$or": [{"_id": {"$in": all_match_ids}}, {"id": {"$in": post_ids}}]},
                {"author_id": {"$nin": user_ids}},
                {"author_username": {"$nin": user_ids}}
            ]
        } if all_match_ids else {"_id": "__no_post__"}

    posts = await ctx.db.find("posts", query, sort_field="created_at", sort_order=-1, limit=limit)
    current_user_id = ctx.auth_user.get("sub") if ctx.auth_user else None
    for p in posts:
        liked_by = p.get("liked_by", [])
        p["likes_count"] = len(liked_by)
        p["is_liked"] = current_user_id in liked_by if current_user_id else False
        p["comments_count"] = p.get("comments_count", 0)
        p["media_urls"] = p.get("media_urls", [p["media_url"]] if p.get("media_url") else [])
        if "liked_by" in p:
            del p["liked_by"]
    posts = await enrich_sync_posts(ctx, posts)
    return posts

# ==========================================
# MUTATIONS (Transactional, Modifies DB)
# ==========================================

@sync_engine.mutation("posts:create")
async def create_post(ctx: MutationContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else "guest_user"
    username = ctx.auth_user.get("username", "guest_user") if ctx.auth_user else "guest_user"

    # Fetch latest user profile to ensure avatar and name are up-to-date
    user = None
    if user_id and user_id != "guest_user":
        try:
            user = await ctx.reader.get("users", user_id)
        except Exception:
            pass
    if not user and username and username != "guest_user":
        try:
            u_list = await ctx.reader.find("users", {"username": username}, limit=1)
            user = u_list[0] if u_list else None
        except Exception:
            pass

    author_avatar = (user.get("avatar_url") if user else None) or args.get("author_avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
    author_fullName = (user.get("full_name") if user else None) or username

    media_urls = args.get("media_urls", [])
    primary_media = args.get("media_url")
    if not primary_media and media_urls and len(media_urls) > 0:
        primary_media = media_urls[0]

    post_doc = {
        "author_id": user_id,
        "author_username": username,
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
        "content": args.get("content", ""),
        "media_url": primary_media,
        "media_urls": media_urls or ([primary_media] if primary_media else []),
        "media_type": args.get("media_type", "photo"),
        "location": args.get("location"),
        "tags": args.get("tags", []),
        "labels": args.get("labels", []),
        "privacy": args.get("privacy", "public"),
        "add_to_story": args.get("add_to_story", False),
        "liked_by": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc)
    }

    # Automatically records Write Set for coll:posts and doc:posts:<id>
    doc_id = await ctx.db.insert("posts", post_doc)
    post_doc["id"] = doc_id

    # Create notification for self
    if ctx.auth_user:
        await ctx.db.insert("notifications", {
            "recipient_id": user_id,
            "actor_id": user_id,
            "actor_username": username,
            "type": "SYSTEM",
            "post_id": doc_id,
            "title": "Post Published!",
            "message": f"Your post '{args.get('content', '')[:30]}...' is now live.",
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })

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

    user = None
    if user_id:
        try:
            user = await ctx.reader.get("users", user_id)
        except Exception:
            pass
    if not user and username:
        try:
            u_list = await ctx.reader.find("users", {"username": username}, limit=1)
            user = u_list[0] if u_list else None
        except Exception:
            pass

    author_avatar = (user.get("avatar_url") if user else None) or args.get("author_avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
    author_fullName = (user.get("full_name") if user else None) or username

    comment_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_username": username,
        "author_fullName": author_fullName,
        "author_avatar": author_avatar,
        "content": content,
        "created_at": datetime.now(timezone.utc)
    }

    comment_id = await ctx.db.insert("comments", comment_doc)
    # Increment post's comment count
    await ctx.db.update("posts", post_id, {"$inc": {"comments_count": 1}})

    comment_doc["id"] = comment_id
    return comment_doc

@sync_engine.mutation("users:updateProfile")
async def update_profile_mutation(ctx: MutationContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else args.get("userId")
    if not user_id:
        uname = args.get("username")
        if uname:
            users_found = await ctx.reader.find("users", {"username": uname}, limit=1)
            if users_found:
                user_id = str(users_found[0].get("id", users_found[0].get("_id", "")))

    if not user_id:
        raise ValueError("User ID required to update profile")

    fields = [
        "full_name", "username", "bio", "avatar_url", "cover_url",
        "location", "website", "social_links", "privacy_settings"
    ]
    updates = {}
    for f in fields:
        if f in args and args[f] is not None:
            updates[f] = args[f]

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await ctx.db.update("users", user_id, {"$set": updates})

    updated_user = await ctx.reader.get("users", user_id)
    if updated_user and "password_hash" in updated_user:
        del updated_user["password_hash"]
    return updated_user

@sync_engine.mutation("users:toggleFollow")
async def toggle_follow_mutation(ctx: MutationContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else args.get("followerId")
    my_username = (ctx.auth_user.get("username") if ctx.auth_user else None) or args.get("followerUsername", "user")
    target_username = args.get("targetUsername", "").strip().lower()

    if not target_username:
        raise ValueError("Target username is required")

    existing = await ctx.reader.find("follows", {
        "follower_id": str(user_id),
        "target_username": target_username
    }, limit=1)

    if existing:
        follow_id = str(existing[0].get("id", existing[0].get("_id", "")))
        await ctx.db.delete("follows", follow_id)
        is_following = False
    else:
        await ctx.db.insert("follows", {
            "follower_id": str(user_id),
            "follower_username": my_username,
            "target_username": target_username,
            "created_at": datetime.now(timezone.utc)
        })
        is_following = True

    all_follows = await ctx.reader.find("follows", {"target_username": target_username})
    return {
        "targetUsername": target_username,
        "isFollowing": is_following,
        "followersCount": len(all_follows)
    }

@sync_engine.query("users:getFollowStatus")
async def get_follow_status_query(ctx: QueryContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else args.get("followerId")
    target_username = args.get("targetUsername", "").strip().lower()
    if not target_username:
        return {"targetUsername": "", "isFollowing": False, "followersCount": 0}

    is_following = False
    if user_id:
        existing = await ctx.db.find("follows", {
            "follower_id": str(user_id),
            "target_username": target_username
        }, limit=1)
        is_following = bool(existing)

    all_follows = await ctx.db.find("follows", {"target_username": target_username})
    return {
        "targetUsername": target_username,
        "isFollowing": is_following,
        "followersCount": len(all_follows)
    }
