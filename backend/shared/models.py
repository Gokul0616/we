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
    avatar_url: Optional[str] = "asset:default_avatar.png"

class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    login: Optional[str] = None
    password: str

class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    social_links: Optional[dict[str, str]] = Field(default_factory=dict)
    privacy_settings: Optional[dict[str, Any]] = Field(default_factory=dict)
    notification_settings: Optional[dict[str, Any]] = Field(default_factory=dict)
    content_preferences: Optional[dict[str, Any]] = Field(default_factory=dict)
    two_factor: Optional[dict[str, Any]] = Field(default_factory=dict)
    blocked_users: Optional[list[str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    social_links: Optional[dict[str, str]] = None
    privacy_settings: Optional[dict[str, Any]] = None
    notification_settings: Optional[dict[str, Any]] = None
    content_preferences: Optional[dict[str, Any]] = None
    two_factor: Optional[dict[str, Any]] = None
    blocked_users: Optional[list[str]] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_urls: Optional[list[str]] = Field(default_factory=list)
    media_type: Optional[str] = "photo"
    location: Optional[str] = None
    tags: Optional[list[str]] = Field(default_factory=list)
    labels: Optional[list[str]] = Field(default_factory=list)
    privacy: Optional[str] = "public"
    add_to_story: Optional[bool] = False

class PostResponse(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_avatar: Optional[str] = None
    content: str
    media_url: Optional[str] = None
    media_urls: Optional[list[str]] = Field(default_factory=list)
    media_type: Optional[str] = "photo"
    location: Optional[str] = None
    tags: Optional[list[str]] = Field(default_factory=list)
    labels: Optional[list[str]] = Field(default_factory=list)
    privacy: Optional[str] = "public"
    add_to_story: Optional[bool] = False
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
