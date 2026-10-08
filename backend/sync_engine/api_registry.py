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
    limit = args.get("limit", 15)
    skip = args.get("skip", 0)
    # The reader automatically tracks Read Set (coll:posts, doc:posts:id)
    posts = await ctx.db.find("posts", {}, sort_field="created_at", sort_order=-1, limit=limit, skip=skip)
    
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
    notifs = await ctx.db.find("notifications", {"recipient_id": user_id}, sort_field="created_at", sort_order=-1, limit=50);
    for n in notifs:
        actor_id = n.get("actor_id")
        if actor_id:
            try:
                actor = await ctx.reader.get("users", actor_id)
                if actor:
                    n["actor_username"] = actor.get("username", n.get("actor_username"))
                    n["actor_fullName"] = actor.get("full_name")
                    n["actor_avatar"] = actor.get("avatar_url")
            except Exception:
                pass
    return notifs

@sync_engine.query("notifications:unreadCount")
async def unread_notifications_count(ctx: QueryContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return {"count": 0}
    user_id = ctx.auth_user["sub"]
    unread = await ctx.db.find("notifications", {"recipient_id": user_id, "read": False})
    return {"count": len(unread)}

@sync_engine.mutation("notifications:markRead")
async def mark_notification_read(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return {"success": False}
    user_id = ctx.auth_user["sub"]
    notif_id = args.get("notificationId")
    if notif_id:
        notif = await ctx.reader.get("notifications", notif_id)
        if notif and notif.get("recipient_id") == user_id:
            await ctx.db.update("notifications", notif_id, {"$set": {"read": True, "readAt": datetime.now(timezone.utc)}})
    return {"success": True}

@sync_engine.mutation("notifications:markAllRead")
async def mark_all_notifications_read(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return {"success": False}
    user_id = ctx.auth_user["sub"]
    notifs = await ctx.reader.find("notifications", {"recipient_id": user_id, "read": False})
    for n in notifs:
        nid = str(n.get("id", n.get("_id", "")))
        if nid:
            await ctx.db.update("notifications", nid, {"$set": {"read": True, "readAt": datetime.now(timezone.utc)}})
    return {"success": True}

@sync_engine.mutation("notifications:clearAll")
async def clear_all_notifications(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return {"success": False}
    user_id = ctx.auth_user["sub"]
    notifs = await ctx.reader.find("notifications", {"recipient_id": user_id})
    for n in notifs:
        nid = str(n.get("id", n.get("_id", "")))
        if nid:
            await ctx.db.delete("notifications", nid)
    return {"success": True}


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
    limit = args.get("limit", 12)
    skip = args.get("skip", 0)

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

    posts = await ctx.db.find("posts", query, sort_field="created_at", sort_order=-1, limit=limit, skip=skip)
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

    author_avatar = (user.get("avatar_url") if user else None) or args.get("author_avatar") or "asset:default_avatar.png"
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
            existing_notif = await ctx.reader.find("notifications", {
                "recipient_id": post["author_id"],
                "actor_id": user_id,
                "type": "LIKE",
                "post_id": post_id
            }, limit=1)
            if not existing_notif:
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

    author_avatar = (user.get("avatar_url") if user else None) or args.get("author_avatar") or "asset:default_avatar.png"
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
    
    # Create COMMENT notification
    post = await ctx.reader.get("posts", post_id)
    if post and post.get("author_id") and post["author_id"] != user_id:
        await ctx.db.insert("notifications", {
            "recipient_id": post["author_id"],
            "actor_id": user_id,
            "actor_username": username,
            "type": "COMMENT",
            "post_id": post_id,
            "comment_id": comment_id,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })

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
        "full_name", "username", "email", "phone", "gender", "date_of_birth",
        "bio", "avatar_url", "cover_url", "location", "website",
        "social_links", "privacy_settings", "notification_settings",
        "content_preferences", "two_factor", "blocked_users"
    ]
    updates = {}
    for f in fields:
        if f in args and args[f] is not None:
            if f == "avatar_url" and not args[f]:
                updates[f] = "asset:default_avatar.png"
            else:
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

    users_found = await ctx.reader.find("users", {"username": target_username}, limit=1)
    target_user = users_found[0] if users_found else None
    target_id = str(target_user.get("id", target_user.get("_id", ""))) if target_user else None
    
    if target_id == user_id:
        raise ValueError("Cannot follow yourself")

    is_private = target_user.get("privacy_settings", {}).get("is_private", False) if target_user else False

    existing_follow = await ctx.reader.find("follows", {
        "follower_id": str(user_id),
        "target_username": target_username
    }, limit=1)

    existing_request = await ctx.reader.find("follow_requests", {
        "follower_id": str(user_id),
        "target_username": target_username
    }, limit=1)

    is_following = False
    is_requested = False

    if existing_follow:
        follow_id = str(existing_follow[0].get("id", existing_follow[0].get("_id", "")))
        await ctx.db.delete("follows", follow_id)
    elif existing_request:
        req_id = str(existing_request[0].get("id", existing_request[0].get("_id", "")))
        await ctx.db.delete("follow_requests", req_id)
        if target_id:
            notifs = await ctx.reader.find("notifications", {
                "recipient_id": target_id,
                "actor_id": user_id,
                "type": "FOLLOW_REQUEST"
            })
            for n in notifs:
                nid = str(n.get("id", n.get("_id", "")))
                await ctx.db.delete("notifications", nid)
    else:
        if is_private:
            await ctx.db.insert("follow_requests", {
                "follower_id": str(user_id),
                "follower_username": my_username,
                "target_id": target_id,
                "target_username": target_username,
                "created_at": datetime.now(timezone.utc)
            })
            is_requested = True
            
            if target_id:
                ext_notif = await ctx.reader.find("notifications", {
                    "recipient_id": target_id,
                    "actor_id": user_id,
                    "type": "FOLLOW_REQUEST"
                }, limit=1)
                if not ext_notif:
                    await ctx.db.insert("notifications", {
                        "recipient_id": target_id,
                        "actor_id": user_id,
                        "actor_username": my_username,
                        "type": "FOLLOW_REQUEST",
                        "read": False,
                        "created_at": datetime.now(timezone.utc)
                    })
        else:
            await ctx.db.insert("follows", {
                "follower_id": str(user_id),
                "follower_username": my_username,
                "target_username": target_username,
                "created_at": datetime.now(timezone.utc)
            })
            is_following = True

            if target_id:
                ext_notif = await ctx.reader.find("notifications", {
                    "recipient_id": target_id,
                    "actor_id": user_id,
                    "type": "FOLLOW"
                }, limit=1)
                if not ext_notif:
                    await ctx.db.insert("notifications", {
                        "recipient_id": target_id,
                        "actor_id": user_id,
                        "actor_username": my_username,
                        "type": "FOLLOW",
                        "read": False,
                        "created_at": datetime.now(timezone.utc)
                    })

    all_follows = await ctx.reader.find("follows", {"target_username": target_username})
    all_following = await ctx.reader.find("follows", {"follower_username": target_username})
    return {
        "targetUsername": target_username,
        "isFollowing": is_following,
        "isRequested": is_requested,
        "followersCount": len(all_follows),
        "followingCount": len(all_following)
    }

@sync_engine.query("followRequests:list")
async def list_follow_requests(ctx: QueryContext, args: dict[str, Any]):
    if not ctx.auth_user:
        return []
    user_id = ctx.auth_user["sub"]
    reqs = await ctx.db.find("follow_requests", {"target_id": user_id}, sort_field="created_at", sort_order=-1)
    for r in reqs:
        actor_id = r.get("follower_id")
        if actor_id:
            try:
                actor = await ctx.reader.get("users", actor_id)
                if actor:
                    r["actor_username"] = actor.get("username", r.get("follower_username"))
                    r["actor_fullName"] = actor.get("full_name")
                    r["actor_avatar"] = actor.get("avatar_url")
            except Exception:
                pass
    return reqs

@sync_engine.mutation("users:acceptFollowRequest")
async def accept_follow_request(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        raise PermissionError("Authentication required")
    user_id = ctx.auth_user["sub"]
    my_username = ctx.auth_user.get("username", "")
    
    follower_id = args.get("followerId")
    if not follower_id:
        raise ValueError("followerId required")

    req = await ctx.reader.find("follow_requests", {
        "target_id": user_id,
        "follower_id": follower_id
    }, limit=1)
    
    if req:
        req_id = str(req[0].get("id", req[0].get("_id", "")))
        follower_username = req[0].get("follower_username", "")
        await ctx.db.delete("follow_requests", req_id)
        
        # Create follow
        await ctx.db.insert("follows", {
            "follower_id": str(follower_id),
            "follower_username": follower_username,
            "target_username": my_username,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create FOLLOW_ACCEPTED notification for the follower
        await ctx.db.insert("notifications", {
            "recipient_id": follower_id,
            "actor_id": user_id,
            "actor_username": my_username,
            "type": "FOLLOW_ACCEPTED",
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
        
    return {"success": True}

@sync_engine.mutation("users:rejectFollowRequest")
async def reject_follow_request(ctx: MutationContext, args: dict[str, Any]):
    if not ctx.auth_user:
        raise PermissionError("Authentication required")
    user_id = ctx.auth_user["sub"]
    
    follower_id = args.get("followerId")
    if not follower_id:
        raise ValueError("followerId required")

    req = await ctx.reader.find("follow_requests", {
        "target_id": user_id,
        "follower_id": follower_id
    }, limit=1)
    
    if req:
        req_id = str(req[0].get("id", req[0].get("_id", "")))
        await ctx.db.delete("follow_requests", req_id)
        
    return {"success": True}


@sync_engine.query("users:getFollowStatus")
async def get_follow_status_query(ctx: QueryContext, args: dict[str, Any]):
    user_id = ctx.auth_user["sub"] if ctx.auth_user else args.get("followerId")
    target_username = args.get("targetUsername", "").strip().lower()
    if not target_username:
        return {"targetUsername": "", "isFollowing": False, "followersCount": 0, "followingCount": 0}

    is_following = False
    if user_id:
        existing = await ctx.db.find("follows", {
            "follower_id": str(user_id),
            "target_username": target_username
        }, limit=1)
        is_following = bool(existing)

    all_follows = await ctx.db.find("follows", {"target_username": target_username})
    all_following = await ctx.db.find("follows", {"follower_username": target_username})
    return {
        "targetUsername": target_username,
        "isFollowing": is_following,
        "followersCount": len(all_follows),
        "followingCount": len(all_following)
    }
