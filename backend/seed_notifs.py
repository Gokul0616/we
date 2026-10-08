import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def seed_notifs():
    client = AsyncIOMotorClient("mongodb+srv://rgokulssb_db_user:yR8r4yhQWphsFJak@cluster0.xsyko1s.mongodb.net/we?appName=Cluster0")
    db = client["we"]
    
    # find user 'gokul'
    gokul = await db.users.find_one({"username": {"$regex": "^gokul", "$options": "i"}})
    if not gokul:
        print("User starting with 'gokul' not found.")
        return
        
    gokul_id = str(gokul.get("id") or gokul.get("_id"))
    gokul_username = gokul.get("username")
    print(f"Found user {gokul_username} ({gokul_id})")
    
    # find some other users to be actors
    actors_cursor = db.users.find({"username": {"$ne": gokul_username}}).limit(3)
    actors = await actors_cursor.to_list(length=3)
    if not actors:
        print("No other users found to act as actors.")
        return
    
    # Insert some fake notifications
    notifs = []
    types = ["LIKE", "COMMENT", "FOLLOW", "MENTION"]
    
    for i, actor in enumerate(actors):
        actor_id = str(actor.get("id") or actor.get("_id"))
        notifs.append({
            "recipient_id": gokul_id,
            "actor_id": actor_id,
            "actor_username": actor.get("username"),
            "actor_avatar": actor.get("avatar_url"),
            "type": types[i % len(types)],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat() # or just datetime
        })
        
    await db.notifications.insert_many(notifs)
    print(f"Inserted {len(notifs)} unread notifications for {gokul_username}")

if __name__ == "__main__":
    asyncio.run(seed_notifs())
