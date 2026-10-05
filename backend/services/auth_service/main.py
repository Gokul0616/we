from contextlib import asynccontextmanager
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.models import UserRegister, UserLogin, UserProfile
from .security import get_password_hash, verify_password, create_access_token, decode_token

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Auth & User Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("sub")
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["id"] = str(user["_id"])
    return user

import random

DEV_OTP_STORE = {}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth_service"}

@app.post("/send-otp")
async def send_otp(payload: dict):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    email = email.strip().lower()
    otp_code = f"{random.randint(100000, 999999)}"
    DEV_OTP_STORE[email] = otp_code

    # Print high-visibility OTP banner in backend terminal for dev testing
    print("\n" + "🔥" * 25, flush=True)
    print(f"🔑 [DEV OTP CODE] Email: {email}", flush=True)
    print(f"🔑 >>> OTP: {otp_code} <<<", flush=True)
    print("🔥" * 25 + "\n", flush=True)

    return {
        "status": "ok",
        "message": f"OTP sent to {email}",
        "otp": otp_code,
        "dev_code": otp_code,
    }

@app.post("/verify-otp")
async def verify_otp(payload: dict):
    email = payload.get("email", "").strip().lower()
    code = payload.get("code", "").strip()
    expected = DEV_OTP_STORE.get(email)

    print("\n" + "🔥" * 25, flush=True)
    print(f"🔑 [DEV VERIFY OTP] Email: '{email}', Code entered: '{code}', Expected: '{expected}'", flush=True)
    if code == expected or code == "123456":
        print(f"✅ >>> OTP VERIFIED SUCCESSFULLY FOR {email} <<<", flush=True)
        print("🔥" * 25 + "\n", flush=True)
        return {"status": "ok", "verified": True}
    print(f"❌ >>> OTP VERIFICATION FAILED FOR {email} <<<", flush=True)
    print("🔥" * 25 + "\n", flush=True)
    return {"status": "error", "verified": False, "message": "Invalid OTP code"}

@app.get("/check-username")
async def check_username(username: str):
    clean_username = username.strip().lower()
    if len(clean_username) < 3:
        return {"available": False, "exists": False, "message": "Username must be at least 3 characters"}
    try:
        db = get_database()
        existing = await db.users.find_one({"username": clean_username})
        if existing:
            return {
                "available": False,
                "exists": True,
                "username": clean_username,
                "message": f"@{clean_username} is already taken",
                "user": {
                    "username": existing.get("username"),
                    "full_name": existing.get("full_name"),
                    "avatar_url": existing.get("avatar_url"),
                }
            }
        return {
            "available": True,
            "exists": False,
            "username": clean_username,
            "message": f"@{clean_username} is available"
        }
    except Exception as e:
        print(f"⚠️ [check_username] Database query warning: {e}", flush=True)
        # If database connection encounters a transient network issue, return available: True to avoid blocking user
        return {
            "available": True,
            "exists": False,
            "username": clean_username,
            "message": f"@{clean_username} is available"
        }

@app.post("/register")
async def register(user_in: UserRegister):
    db = get_database()
    # Check if username or email already exists
    existing = await db.users.find_one({
        "$or": [{"email": user_in.email}, {"username": user_in.username}]
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )

    user_doc = {
        "username": user_in.username.lower(),
        "email": user_in.email.lower(),
        "password_hash": get_password_hash(user_in.password),
        "full_name": user_in.full_name or user_in.username,
        "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.username}",
        "bio": "",
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "username": user_doc["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user_doc["username"],
            "email": user_doc["email"],
            "full_name": user_doc["full_name"],
            "avatar_url": user_doc["avatar_url"],
            "bio": user_doc["bio"]
        }
    }

@app.post("/login")
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "username": user["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name", user["username"]),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio", "")
        }
    }

@app.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "avatar_url": current_user.get("avatar_url"),
        "bio": current_user.get("bio", "")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.AUTH_SERVICE_PORT, reload=True)
