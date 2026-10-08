import asyncio
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from services.auth_service.security import get_password_hash
import random

async def seed_full():
    await connect_to_mongo()
    db = get_database()
    
    print("Clearing full database...")
    await db.users.delete_many({})
    await db.posts.delete_many({})
    await db.follows.delete_many({})
    await db.comments.delete_many({})
    await db.notifications.delete_many({})
    
    print("Seeding 10 users...")
    users_data = [
        {"username": "alex_wanderer", "full_name": "Alex Wanderer", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80"},
        {"username": "sarah_k", "full_name": "Sarah K", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80"},
        {"username": "travel.diary", "full_name": "Travel Diary", "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80"},
        {"username": "creative_john", "full_name": "John Doe", "avatar_url": "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=160&q=80"},
        {"username": "design_anna", "full_name": "Anna Design", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80"},
        {"username": "chef_mario", "full_name": "Mario Chef", "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&q=80"},
        {"username": "fit_lucy", "full_name": "Lucy Fit", "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80"},
        {"username": "tech_bob", "full_name": "Bob Tech", "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&q=80"},
        {"username": "art_julia", "full_name": "Julia Art", "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&q=80"},
    ]
    
    user_docs = []
    # Create the requested user for the USER
    my_user = {
        "username": "gokul",
        "email": "gokul@gmail.com",
        "password_hash": get_password_hash("password123"),
        "full_name": "Gokul",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&q=80",
        "bio": "Digital creator & explorer 📸 Living between moments and memories ✨",
        "created_at": datetime.now(timezone.utc)
    }
    user_docs.append(my_user)
    
    for u in users_data:
        user_docs.append({
            "username": u["username"],
            "email": f"{u['username']}@example.com",
            "password_hash": get_password_hash("password123"),
            "full_name": u["full_name"],
            "avatar_url": u["avatar_url"],
            "bio": f"Bio of {u['full_name']}",
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 100))
        })
    
    inserted_users = await db.users.insert_many(user_docs)
    user_ids = [str(id) for id in inserted_users.inserted_ids]
    
    print("Seeding posts...")
    media_urls = [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
        "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&q=80",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80"
    ]
    
    post_docs = []
    
    for i in range(50):
        author_doc = random.choice(user_docs)
        u_idx = user_docs.index(author_doc)
        author_id = user_ids[u_idx]
        post = {
            "author_id": author_id,
            "author_username": author_doc["username"],
            "author_fullName": author_doc["full_name"],
            "author_avatar": author_doc["avatar_url"],
            "content": f"This is an amazing post number {i}!",
            "media_url": random.choice(media_urls),
            "media_urls": [random.choice(media_urls)],
            "media_type": "photo",
            "location": "Earth",
            "tags": ["awesome", "fun"],
            "labels": ["#awesome"],
            "privacy": "public",
            "likes_count": random.randint(10, 500),
            "comments_count": random.randint(5, 50),
            "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 200))
        }
        
        # Add 'gokul' specific posts
        if i < 15:
            post["author_id"] = user_ids[0]
            post["author_username"] = "gokul"
            post["author_fullName"] = "Gokul"
            post["author_avatar"] = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&q=80"
            post["content"] = f"Gokul's awesome post {i}!"
        
        post_docs.append(post)
        
    await db.posts.insert_many(post_docs)
    
    print("Seeding follows...")
    follows_to_insert = []
    for u1 in user_docs:
        for u2 in user_docs:
            if u1["username"] != u2["username"] and random.random() < 0.3:
                u1_id = user_ids[user_docs.index(u1)]
                follows_to_insert.append({
                    "follower_id": u1_id,
                    "follower_username": u1["username"],
                    "target_username": u2["username"],
                    "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10))
                })
    if follows_to_insert:
        await db.follows.insert_many(follows_to_insert)

    print("✅ Full DB seed complete!")
    print("\n====================")
    print("YOUR ACCOUNT DETAILS:")
    print("Username: gokul")
    print("Password: password123")
    print("====================")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_full())
