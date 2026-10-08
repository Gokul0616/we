import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient("mongodb+srv://rgokulssb_db_user:yR8r4yhQWphsFJak@cluster0.xsyko1s.mongodb.net/we?appName=Cluster0")
    db = client.we
    
    # Delete all notifications
    res = await db.notifications.delete_many({})
    print(f"Deleted {res.deleted_count} notifications")
    
    # Delete all follow requests
    res = await db.follow_requests.delete_many({})
    print(f"Deleted {res.deleted_count} follow requests")
    
    # Optional: Delete all follows to reset state
    res = await db.follows.delete_many({})
    print(f"Deleted {res.deleted_count} follows")
    
if __name__ == "__main__":
    asyncio.run(run())
