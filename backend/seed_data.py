import asyncio
from datetime import datetime, timezone, timedelta
from shared.database import connect_to_mongo, close_mongo_connection, get_database

POSTS_TO_SEED = [
    {
        "author_id": "user_alex",
        "author_username": "alex_wanderer",
        "author_avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80",
        "content": "Grateful for moments like this 🌅 Life is better outside.",
        "media_url": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
        "media_urls": ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"],
        "media_type": "photo",
        "location": "Bali, Indonesia",
        "tags": ["travel", "wanderlust"],
        "labels": ["#Travel", "#Nature"],
        "privacy": "public",
        "liked_by": ["user_current"],
        "comments_count": 14,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=2)
    },
    {
        "author_id": "user_sarah",
        "author_username": "sarah_k",
        "author_avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80",
        "content": "Some places just feel like home 💙 Golden hour over the coast.",
        "media_url": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
        "media_urls": ["https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80"],
        "media_type": "photo",
        "location": "Cinque Terre, Italy",
        "tags": ["italy", "coast"],
        "labels": ["#Travel", "#Photography"],
        "privacy": "public",
        "liked_by": [],
        "comments_count": 8,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=5)
    },
    {
        "author_id": "user_current",
        "author_username": "gokul_ssb",
        "author_avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&q=80",
        "content": "Quiet mornings overlooking the cliffs. Living inside a postcard 🌊✨",
        "media_url": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
        "media_urls": ["https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80"],
        "media_type": "photo",
        "location": "Positano, Italy",
        "tags": ["italy", "cliffside"],
        "labels": ["#Travel", "#Vibes"],
        "privacy": "public",
        "liked_by": ["user_alex", "user_sarah"],
        "comments_count": 22,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=8)
    },
    {
        "author_id": "user_travel",
        "author_username": "travel.diary",
        "author_avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80",
        "content": "Just returned from an amazing week in Iceland! The volcanic landscapes are unreal 🇮🇸🏔️",
        "media_url": "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80",
        "media_urls": ["https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80"],
        "media_type": "photo",
        "location": "Reykjavik, Iceland",
        "tags": ["iceland", "nature"],
        "labels": ["#Nature", "#Travel"],
        "privacy": "public",
        "liked_by": [],
        "comments_count": 19,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=14)
    },
    {
        "author_id": "user_current",
        "author_username": "gokul_ssb",
        "author_avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&q=80",
        "content": "Above the clouds at 3,000 meters. The silence up here is medicine for the soul 🏔️",
        "media_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        "media_urls": ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"],
        "media_type": "photo",
        "location": "Swiss Alps, Switzerland",
        "tags": ["alps", "hiking"],
        "labels": ["#Nature", "#Lifestyle"],
        "privacy": "public",
        "liked_by": ["user_alex"],
        "comments_count": 31,
        "created_at": datetime.now(timezone.utc) - timedelta(days=1)
    }
]

async def seed():
    await connect_to_mongo()
    db = get_database()
    # Remove older test posts that have no media
    await db.posts.delete_many({"media_url": None})
    
    count = await db.posts.count_documents({})
    if count == 0:
        print(f"Seeding {len(POSTS_TO_SEED)} authentic posts into database...")
        await db.posts.insert_many(POSTS_TO_SEED)
        print("✅ Seeding complete!")
    else:
        print(f"Database already contains {count} posts.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
