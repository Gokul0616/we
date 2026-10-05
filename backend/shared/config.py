import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file reliably from backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class Settings(BaseSettings):
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "we")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    GATEWAY_PORT: int = int(os.getenv("GATEWAY_PORT", "8000"))
    AUTH_SERVICE_PORT: int = int(os.getenv("AUTH_SERVICE_PORT", "8001"))
    POST_SERVICE_PORT: int = int(os.getenv("POST_SERVICE_PORT", "8002"))
    NOTIFICATION_SERVICE_PORT: int = int(os.getenv("NOTIFICATION_SERVICE_PORT", "8003"))

    class Config:
        env_file = str(ENV_PATH)
        extra = "allow"

settings = Settings()
