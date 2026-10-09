from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Post composition limits — enforced identically on the HTTP path (FastAPI)
# and the realtime sync path so both transports behave the same way.
# ---------------------------------------------------------------------------
MAX_POST_CONTENT_LENGTH = 1000
MAX_POST_MEDIA = 10
MAX_POST_TAGS = 8
MAX_TAG_LENGTH = 30
PRIVACY_LEVELS = ("public", "friends", "private")
MEDIA_TYPES = ("none", "photo", "video", "carousel")
REMOTE_SCHEMES = ("http://", "https://")

VIDEO_EXTENSIONS = (".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v")


def require_remote_media_url(url: str) -> str:
    """Reject device-local URIs (file://, content://) and bundled asset keys.

    Only publicly resolvable http(s) URLs may be persisted — anything else
    renders as broken media in every feed that loads this post.
    """
    if not isinstance(url, str) or not url.strip():
        raise ValueError("Media URLs must be non-empty strings")
    cleaned = url.strip()
    if not cleaned.startswith(REMOTE_SCHEMES):
        raise ValueError(
            "Media must be uploaded first (only http/https URLs are allowed); "
            f"got '{cleaned[:48]}'"
        )
    return cleaned


def resolve_media_type(requested: Optional[str], media_urls: list[str]) -> str:
    """Derive the post's media_type from what is actually attached."""
    if not media_urls:
        return "none"
    if len(media_urls) > 1:
        return "carousel"
    if requested in ("photo", "video"):
        return requested
    path = media_urls[0].split("?")[0].lower()
    return "video" if path.endswith(VIDEO_EXTENSIONS) else "photo"


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
    content: str = Field(default="", max_length=MAX_POST_CONTENT_LENGTH)
    media_url: Optional[str] = None
    media_urls: list[str] = Field(default_factory=list)
    media_type: Optional[str] = "photo"
    location: Optional[str] = Field(default=None, max_length=120)
    # Optional device/pick coordinates for `location` (both or neither).
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    tags: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)
    privacy: str = "public"
    add_to_story: bool = False
    client_post_id: Optional[str] = Field(default=None, max_length=64)

    @field_validator("media_url")
    @classmethod
    def _validate_primary_media(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value == "":
            return None
        return require_remote_media_url(value)

    @field_validator("media_urls")
    @classmethod
    def _validate_media_list(cls, value: list[str]) -> list[str]:
        if len(value) > MAX_POST_MEDIA:
            raise ValueError(f"A post can contain at most {MAX_POST_MEDIA} media items")
        return [require_remote_media_url(url) for url in value]

    @field_validator("privacy")
    @classmethod
    def _validate_privacy(cls, value: str) -> str:
        if value not in PRIVACY_LEVELS:
            raise ValueError(f"privacy must be one of {PRIVACY_LEVELS}")
        return value

    @field_validator("media_type")
    @classmethod
    def _validate_media_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if value not in MEDIA_TYPES:
            raise ValueError(f"media_type must be one of {MEDIA_TYPES}")
        return value

    @field_validator("tags")
    @classmethod
    def _validate_tags(cls, value: list[str]) -> list[str]:
        normalised: list[str] = []
        for raw in value:
            tag = str(raw).strip().lstrip("#").replace(" ", "")
            if not tag:
                continue
            if len(tag) > MAX_TAG_LENGTH:
                raise ValueError(f"Topic '#{tag[:MAX_TAG_LENGTH]}…' is too long")
            tag = f"#{tag}"
            if tag not in normalised:
                normalised.append(tag)
        if len(normalised) > MAX_POST_TAGS:
            raise ValueError(f"Too many topics — at most {MAX_POST_TAGS} allowed")
        return normalised

    @field_validator("location_lat")
    @classmethod
    def _validate_latitude(cls, value: Optional[float]) -> Optional[float]:
        if value is None:
            return None
        # `not (low <= nan <= high)` also rejects NaN / non-finite input.
        if not (-90.0 <= float(value) <= 90.0):
            raise ValueError("location_lat must be between -90 and 90")
        return float(value)

    @field_validator("location_lng")
    @classmethod
    def _validate_longitude(cls, value: Optional[float]) -> Optional[float]:
        if value is None:
            return None
        if not (-180.0 <= float(value) <= 180.0):
            raise ValueError("location_lng must be between -180 and 180")
        return float(value)

    @model_validator(mode="after")
    def _require_content_or_media(self) -> "PostCreate":
        if not self.content.strip() and not self.media_urls and not self.media_url:
            raise ValueError("A post needs a caption or at least one photo/video")
        if (self.location_lat is None) != (self.location_lng is None):
            raise ValueError(
                "location_lat and location_lng must be provided together"
            )
        return self


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
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
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
