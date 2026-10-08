import asyncio
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from shared.database import connect_to_mongo, close_mongo_connection, get_database

GOKUL_CAPTIONS_AND_IMAGES = [
    (
        "Chasing golden light along the coast. Some places make you forget the concept of time 🌊🌅",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        "Amalfi Coast, Italy 🇮🇹",
        ["travel", "wanderlust"],
        ["#Travel", "#Nature"]
    ),
    (
        "Espresso and quiet morning reflections in the heart of Rome ☕️🥐",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
        "Rome, Italy 🇮🇹",
        ["coffee", "lifestyle"],
        ["#Food", "#Lifestyle"]
    ),
    (
        "3,000 meters above sea level. Crisp mountain air and silence you can actually feel 🏔️❄️",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        "Zermatt, Switzerland 🇨🇭",
        ["mountains", "alps"],
        ["#Nature", "#Travel"]
    ),
    (
        "Golden hour casting shadows through ancient bamboo pathways 🎋✨",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
        "Kyoto, Japan ⛩️",
        ["kyoto", "japan"],
        ["#Photography", "#Travel"]
    ),
    (
        "Architectural perfection in every geometric curve 🏛️ Clean lines and raw concrete.",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "Copenhagen, Denmark 🇩🇰",
        ["architecture", "minimalism"],
        ["#Design", "#Art"]
    ),
    (
        "Lost in the narrow cobbled streets as the sun sets over the harbor ⛵️",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
        "Santorini, Greece 🇬🇷",
        ["santorini", "sunset"],
        ["#Travel", "#Vibes"]
    ),
    (
        "Deep emerald water hidden inside tropical canyons. Nature is unmatched 🌿💦",
        "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&q=80",
        "Ubud, Bali 🌴",
        ["bali", "waterfall"],
        ["#Nature", "#Travel"]
    ),
    (
        "Late night Tokyo neon reflections in the rain 🌧️ Neon dreams never sleep.",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80",
        "Shinjuku, Tokyo 🇯🇵",
        ["tokyo", "street"],
        ["#Photography", "#Vibes"]
    ),
    (
        "The smell of fresh sourdough and artisanal pastry at sunrise 🥖✨",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
        "Paris, France 🇫🇷",
        ["bakery", "food"],
        ["#Food", "#Lifestyle"]
    ),
    (
        "Endless horizon across the sand dunes. Golden hour desert magic 🐪🏜️",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80",
        "Sahara Desert, Morocco 🇲🇦",
        ["desert", "sunset"],
        ["#Travel", "#Photography"]
    ),
    (
        "Vintage books, warm amber lamps, and the sound of rainfall outside 📚☕️",
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
        "Oxford, UK 🇬🇧",
        ["reading", "cozy"],
        ["#Lifestyle", "#Art"]
    ),
    (
        "First light hitting the turquoise lagoons. Unfiltered paradise 🏝️🐠",
        "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
        "Maldives 🇲🇻",
        ["maldives", "ocean"],
        ["#Nature", "#Travel"]
    ),
    (
        "Modern minimalism in workspace aesthetics. Focus flow activated 💻✨",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        "Stockholm, Sweden 🇸🇪",
        ["workspace", "design"],
        ["#Tech", "#Design"]
    ),
    (
        "Autumn colors painting the northern forests in crimson and gold 🍂🍁",
        "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80",
        "Vermont, USA 🇺🇸",
        ["autumn", "foliage"],
        ["#Nature", "#Photography"]
    ),
    (
        "Rooftop views as the city lights awaken under twilight skies 🏙️🌆",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        "Manhattan, New York 🗽",
        ["nyc", "skyline"],
        ["#Photography", "#Vibes"]
    ),
    (
        "Exploring hidden underground caves where sunlight pierces like laser beams 🔦✨",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
        "Tulum, Mexico 🇲🇽",
        ["cenote", "caves"],
        ["#Nature", "#Travel"]
    ),
    (
        "Street photography in Lisbon. Yellow tram climbing sunlit historic alleys 🚋☀️",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "Lisbon, Portugal 🇵🇹",
        ["lisbon", "streetphotography"],
        ["#Travel", "#Photography"]
    ),
    (
        "Fresh harvest bowl with organic avocado, quinoa, and farm vegetables 🥗🥑",
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
        "Melbourne, Australia 🇦🇺",
        ["healthy", "foodie"],
        ["#Food", "#Lifestyle"]
    ),
    (
        "Camping under the Milky Way. Millions of stars and absolute peace 🌌⛺️",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
        "Dolomites, Italy 🏔️",
        ["astrophotography", "stars"],
        ["#Nature", "#Photography"]
    ),
    (
        "Classic vinyl spinning on an acoustic afternoon. Analog soul in a digital world 🎵📻",
        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
        "London, UK 🇬🇧",
        ["music", "vinyl"],
        ["#Art", "#Vibes"]
    ),
    (
        "Floating through emerald canals at daybreak before the city wakes up 🛶",
        "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80",
        "Venice, Italy 🇮🇹",
        ["venice", "canals"],
        ["#Travel", "#Photography"]
    ),
    (
        "Mist rolling over alpine pine forests. Quiet wonder 🌲🌫️",
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
        "Black Forest, Germany 🇩🇪",
        ["forest", "fog"],
        ["#Nature", "#Travel"]
    ),
    (
        "Handcrafted ceramic coffee mug with morning pour-over ☕️ Appreciating craftsmanship.",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
        "San Francisco, USA 🌉",
        ["coffee", "craft"],
        ["#Lifestyle", "#Design"]
    ),
    (
        "Watching the sunset bathe the Taj Mahal in rose gold light 🕌✨ Truly breathtaking.",
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
        "Agra, India 🇮🇳",
        ["india", "heritage"],
        ["#Travel", "#Photography"]
    ),
    (
        "Surfing the morning breaks as dawn breaks on the southern coast 🏄‍♂️🌊",
        "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80",
        "Gold Coast, Australia 🇦🇺",
        ["surf", "ocean"],
        ["#Nature", "#Lifestyle"]
    ),
    (
        "Contemporary art gallery morning. Pure space, shadows, and thought-provoking forms 🖼️",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
        "Berlin, Germany 🇩🇪",
        ["art", "modernart"],
        ["#Art", "#Design"]
    ),
    (
        "Chilled afternoon by the lake with mountains mirrored like glass 🏔️🪞",
        "https://images.unsplash.com/photo-1439853941329-a95e0b95d10f?w=800&q=80",
        "Lake Como, Italy 🇮🇹",
        ["lakecomo", "reflection"],
        ["#Nature", "#Travel"]
    ),
    (
        "Night market adventures and delicious steaming dumplings 🥟🥢",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
        "Taipei, Taiwan 🇹🇼",
        ["streetfood", "nightmarket"],
        ["#Food", "#Travel"]
    ),
    (
        "Snow dusted cabins nestled deep in Nordic pine winter wonderland ❄️🏡",
        "https://images.unsplash.com/photo-1517299321929-30a7063fa528?w=800&q=80",
        "Lapland, Finland 🇫🇮",
        ["winter", "snow"],
        ["#Nature", "#Travel"]
    ),
    (
        "A peaceful sanctuary in the hills. Grateful for this journey and all who share it ✨🙏",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
        "Shimla, India 🇮🇳",
        ["peace", "hills"],
        ["#Travel", "#Nature"]
    )
]

DEMO_FOLLOWER_USERNAMES = [
    ("alex_wanderer", "Alex Rivera"),
    ("sarah_k", "Sarah Jenkins"),
    ("travel.diary", "Sophie Dupont"),
    ("chef_marco", "Marco Bellini"),
    ("elena_visuals", "Elena Rostova"),
    ("kathir", "Kathir"),
    ("jordan_tech", "Jordan Vance"),
    ("maya_art", "Maya Lin"),
    ("lucas_explorer", "Lucas Silva"),
    ("clara_design", "Clara Schmidt"),
    ("david_shots", "David Miller"),
    ("nina_yoga", "Nina Patel")
]

async def seed_gokul():
    await connect_to_mongo()
    db = get_database()

    # 1. Find or verify user gokul
    gokul_user = await db.users.find_one({"username": "gokul"})
    if not gokul_user:
        print("User 'gokul' not found! Creating user 'gokul'...")
        from shared.security import get_password_hash
        user_doc = {
            "username": "gokul",
            "email": "gokul@gmail.com",
            "password_hash": get_password_hash("password123"),
            "full_name": "Gokul",
            "avatar_url": "asset:default_avatar.png",
            "bio": "Digital creator & explorer 📸 Living between moments and memories ✨",
            "created_at": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(user_doc)
        gokul_user = await db.users.find_one({"_id": res.inserted_id})

    user_id = str(gokul_user["_id"])
    print(f"Target user: {gokul_user['username']} (ID: {user_id})")

    # 2. Clear old posts by gokul to avoid duplicates and seed 30 authentic posts
    deleted_posts = await db.posts.delete_many({"author_username": "gokul"})
    print(f"Cleared {deleted_posts.deleted_count} existing posts for gokul.")

    new_posts = []
    base_time = datetime.now(timezone.utc)

    for i, (caption, media_url, location, tags, labels) in enumerate(GOKUL_CAPTIONS_AND_IMAGES):
        # Spread post created_at over the last 30 days
        created_at = base_time - timedelta(hours=i * 22 + (i % 5))
        likes_count = 14 + (i * 7) % 180 + (i * 3)
        comments_count = 2 + (i * 3) % 28

        post = {
            "author_id": user_id,
            "author_username": "gokul",
            "author_fullName": gokul_user.get("full_name") or "Gokul",
            "author_avatar": gokul_user.get("avatar_url") or "asset:default_avatar.png",
            "content": caption,
            "media_url": media_url,
            "media_urls": [media_url],
            "media_type": "photo",
            "location": location,
            "tags": tags,
            "labels": labels,
            "privacy": "public",
            "likes_count": likes_count,
            "comments_count": comments_count,
            "liked_by": ["user_alex", "user_sarah"] if i % 2 == 0 else ["user_alex"],
            "created_at": created_at
        }
        new_posts.append(post)

    await db.posts.insert_many(new_posts)
    print(f"✅ Successfully seeded {len(new_posts)} image posts with captions for gokul!")

    # 3. Seed dynamic followers and following for gokul
    await db.follows.delete_many({"$or": [{"target_username": "gokul"}, {"follower_username": "gokul"}]})

    follows_to_insert = []
    # People who follow gokul (Followers)
    for follower_uname, follower_name in DEMO_FOLLOWER_USERNAMES:
        follows_to_insert.append({
            "follower_id": f"user_{follower_uname}",
            "follower_username": follower_uname,
            "target_username": "gokul",
            "created_at": datetime.now(timezone.utc) - timedelta(days=10)
        })

    # People gokul follows (Following)
    for following_uname, following_name in DEMO_FOLLOWER_USERNAMES[:7]:
        follows_to_insert.append({
            "follower_id": user_id,
            "follower_username": "gokul",
            "target_username": following_uname,
            "created_at": datetime.now(timezone.utc) - timedelta(days=5)
        })

    # Also seed follow for other profiles like alex_wanderer and sarah_k so their counts are dynamic
    for other_user in ["alex_wanderer", "sarah_k", "travel.diary"]:
        for follower_uname, _ in DEMO_FOLLOWER_USERNAMES[:6]:
            if follower_uname != other_user:
                follows_to_insert.append({
                    "follower_id": f"user_{follower_uname}",
                    "follower_username": follower_uname,
                    "target_username": other_user,
                    "created_at": datetime.now(timezone.utc) - timedelta(days=12)
                })

    if follows_to_insert:
        await db.follows.insert_many(follows_to_insert)
        print(f"✅ Successfully seeded {len(follows_to_insert)} dynamic follow relationships!")

    # 4. Verify counts
    followers_count = await db.follows.count_documents({"target_username": "gokul"})
    following_count = await db.follows.count_documents({"follower_username": "gokul"})
    print(f"gokul now has: {followers_count} followers and {following_count} following.")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_gokul())
