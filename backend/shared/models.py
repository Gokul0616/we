from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field

class MongoBaseModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_avatar: Optional[str] = None
    content: str
    media_url: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_username: str
    content: str
    created_at: str

# Realtime WebSocket protocol models
class RealtimeMessage(BaseModel):
    action: str  # e.g., "subscribe", "unsubscribe", "ping"
    topic: str   # e.g., "feed", "post:{post_id}", "user:{user_id}"

class RealtimeEvent(BaseModel):
    topic: str
    event: str  # e.g., "POST_CREATED", "POST_LIKED", "COMMENT_ADDED"
    data: Any
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
