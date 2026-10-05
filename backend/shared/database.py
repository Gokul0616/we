import logging
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient
from .config import settings

logger = logging.getLogger("database")

class MongoDB:
    client = None
    db = None

db_instance = MongoDB()

async def connect_to_mongo():
    url = settings.MONGODB_URL
    if "<db_username>" in url or "<db_password>" in url:
        logger.warning("MongoDB URI contains placeholder '<db_username>'. Initializing local MongoMock database fallback so real-time sync works immediately!")
        db_instance.client = AsyncMongoMockClient()
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
        return

    try:
        real_client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=4000)
        await real_client.admin.command("ping")
        db_instance.client = real_client
        db_instance.db = real_client[settings.MONGODB_DB_NAME]
        logger.info(f"Connected to MongoDB Atlas: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB Atlas ({e}). Falling back to local MongoMock database.")
        db_instance.client = AsyncMongoMockClient()
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection.")

def get_database():
    return db_instance.db
