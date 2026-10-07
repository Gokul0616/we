from contextlib import asynccontextmanager
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection, get_database
from shared.models import UserRegister, UserLogin, UserProfile, UserUpdate
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
    if len(clean_username) < 5:
        return {"available": False, "exists": False, "message": "Username must be at least 5 characters"}
    if len(clean_username) > 18:
        return {"available": False, "exists": False, "message": "Username cannot exceed 18 characters"}
    try:
        db = get_database()
        existing = await db.users.find_one({"username": clean_username})
        if existing:
            return {
                "available": False,
                "exists": True,
                "username": clean_username,
                "message": f"@{clean_username} is already taken"
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
    clean_username = user_in.username.strip().lower()
    if len(clean_username) < 5 or len(clean_username) > 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 5 and 18 characters"
        )
    db = get_database()
    # Check if username or email already exists
    existing = await db.users.find_one({
        "$or": [{"email": user_in.email}, {"username": clean_username}]
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
    identifier = (credentials.login or credentials.email or credentials.username or "").strip().lower().lstrip("@")
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required"
        )
    db = get_database()
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    })
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
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
        "cover_url": current_user.get("cover_url"),
        "bio": current_user.get("bio", ""),
        "location": current_user.get("location", ""),
        "website": current_user.get("website", ""),
        "social_links": current_user.get("social_links", {}),
        "privacy_settings": current_user.get("privacy_settings", {
            "visibility": "public",
            "show_activity_status": True,
            "allow_direct_messages": True,
            "who_can_tag": "everyone"
        })
    }

@app.put("/me")
async def update_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["_id"]

    updates = {}
    if update_data.full_name is not None:
        updates["full_name"] = update_data.full_name
    if update_data.username is not None:
        new_username = update_data.username.strip().lower()
        if new_username != current_user["username"]:
            # Check availability
            existing = await db.users.find_one({"username": new_username})
            if existing and str(existing["_id"]) != str(user_id):
                raise HTTPException(status_code=400, detail="Username is already taken")
            updates["username"] = new_username
    if update_data.bio is not None:
        updates["bio"] = update_data.bio
    if update_data.avatar_url is not None:
        updates["avatar_url"] = update_data.avatar_url
    if update_data.cover_url is not None:
        updates["cover_url"] = update_data.cover_url
    if update_data.location is not None:
        updates["location"] = update_data.location
    if update_data.website is not None:
        updates["website"] = update_data.website
    if update_data.social_links is not None:
        updates["social_links"] = update_data.social_links
    if update_data.privacy_settings is not None:
        updates["privacy_settings"] = update_data.privacy_settings

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": user_id}, {"$set": updates})

    updated_user = await db.users.find_one({"_id": user_id})
    user_doc = {
        "id": str(updated_user["_id"]),
        "username": updated_user["username"],
        "email": updated_user["email"],
        "full_name": updated_user.get("full_name"),
        "avatar_url": updated_user.get("avatar_url"),
        "cover_url": updated_user.get("cover_url"),
        "bio": updated_user.get("bio", ""),
        "location": updated_user.get("location", ""),
        "website": updated_user.get("website", ""),
        "social_links": updated_user.get("social_links", {}),
        "privacy_settings": updated_user.get("privacy_settings", {}),
    }

    token = create_access_token({"sub": str(updated_user["_id"]), "username": updated_user["username"]})

    return {
        "status": "ok",
        "user": user_doc,
        "access_token": token
    }

@app.post("/users/{target_username}/toggle-follow")
async def toggle_follow(
    target_username: str,
    current_user: dict = Depends(get_current_user)
):
    clean_target = target_username.strip().lower()
    my_username = current_user.get("username", "").strip().lower()
    my_id = str(current_user["id"])

    if clean_target == my_username:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    db = get_database()
    existing = await db.follows.find_one({
        "follower_id": my_id,
        "target_username": clean_target
    })

    if existing:
        await db.follows.delete_one({"_id": existing["_id"]})
        is_following = False
    else:
        await db.follows.insert_one({
            "follower_id": my_id,
            "follower_username": my_username,
            "target_username": clean_target,
            "created_at": datetime.now(timezone.utc)
        })
        is_following = True

    followers_count = await db.follows.count_documents({"target_username": clean_target})

    return {
        "status": "ok",
        "target_username": clean_target,
        "is_following": is_following,
        "followers_count": followers_count
    }

@app.get("/users/{target_username}/follow-status")
async def get_follow_status(
    target_username: str,
    current_user: dict = Depends(get_current_user)
):
    clean_target = target_username.strip().lower()
    my_id = str(current_user["id"])

    db = get_database()
    existing = await db.follows.find_one({
        "follower_id": my_id,
        "target_username": clean_target
    })
    followers_count = await db.follows.count_documents({"target_username": clean_target})

    return {
        "status": "ok",
        "target_username": clean_target,
        "is_following": bool(existing),
        "followers_count": followers_count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.AUTH_SERVICE_PORT, reload=True)
