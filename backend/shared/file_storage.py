import os
import uuid
import base64
import mimetypes
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException

try:
    from shared.config import settings
except ImportError:
    from config import settings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed media extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

# Upload size ceilings — enforced before anything touches disk so a single
# oversized upload can't fill the box (images are re-encoded clientside to ~0.85).
MAX_IMAGE_BYTES = 15 * 1024 * 1024   # 15 MB
MAX_VIDEO_BYTES = 100 * 1024 * 1024  # 100 MB


def enforce_size_limit(size: int, ext: str) -> None:
    limit = MAX_VIDEO_BYTES if ext in ALLOWED_VIDEO_EXTENSIONS else MAX_IMAGE_BYTES
    if size > limit:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File is too large ({size // (1024 * 1024)} MB). "
                f"Limit is {limit // (1024 * 1024)} MB."
            ),
        )

class FileStorage:
    """
    Centralized file storage component for WE Social backend.
    Saves uploaded files securely to server disk, validates extensions,
    prevents path traversal, and returns client-accessible URLs.
    """

    @staticmethod
    def get_upload_dir() -> str:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        return UPLOAD_DIR

    @staticmethod
    def get_subfolder_dir(subfolder: str) -> str:
        clean_subfolder = os.path.basename(subfolder.strip("/"))
        target_dir = os.path.join(UPLOAD_DIR, clean_subfolder)
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    @classmethod
    async def save_upload_file(
        cls,
        uploaded_file: UploadFile,
        subfolder: str = "general",
        base_url: str = "",
        allowed_types: Optional[set] = None,
    ) -> dict:
        if not uploaded_file:
            raise HTTPException(status_code=400, detail="No file selected for upload")

        orig_name = getattr(uploaded_file, "filename", "") or "media.jpg"
        ext = os.path.splitext(orig_name)[1].lower()

        if not ext:
            mime = getattr(uploaded_file, "content_type", "") or ""
            if "video" in mime or "mp4" in mime:
                ext = ".mp4"
            elif "mov" in mime:
                ext = ".mov"
            elif "png" in mime:
                ext = ".png"
            elif "webp" in mime:
                ext = ".webp"
            else:
                ext = ".jpg"

        effective_allowed = allowed_types or ALLOWED_EXTENSIONS
        if ext not in effective_allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(effective_allowed))}",
            )

        # Cheap pre-check when the framework already knows the declared length
        declared_size = getattr(uploaded_file, "size", None)
        if isinstance(declared_size, int) and declared_size > 0:
            enforce_size_limit(declared_size, ext)

        target_dir = cls.get_subfolder_dir(subfolder)
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(target_dir, filename)

        # Security check: Prevent path traversal
        normalized_path = os.path.abspath(file_path)
        if not normalized_path.startswith(os.path.abspath(UPLOAD_DIR)):
            raise HTTPException(status_code=403, detail="Forbidden: Path traversal detected")

        file_bytes = await uploaded_file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        enforce_size_limit(len(file_bytes), ext)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        effective_base_url = (base_url or getattr(settings, "BACKEND_BASE_URL", "")).rstrip("/")
        relative_path = f"/uploads/{subfolder}/{filename}" if subfolder != "general" else f"/uploads/{filename}"
        full_url = f"{effective_base_url}{relative_path}" if effective_base_url else relative_path

        media_category = "video" if ext in ALLOWED_VIDEO_EXTENSIONS else "image"

        return {
            "url": full_url,
            "relative_url": relative_path,
            "filename": filename,
            "media_type": media_category,
            "size": len(file_bytes),
            "status": "ok",
        }

    @classmethod
    def save_base64(
        cls,
        base64_data: str,
        media_type: str = "image/jpeg",
        subfolder: str = "general",
        base_url: str = "",
    ) -> dict:
        if not base64_data:
            raise HTTPException(status_code=400, detail="Empty data provided")

        raw_data = base64_data
        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]

        try:
            file_bytes = base64.b64decode(raw_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 payload")

        ext = ".jpg"
        if "png" in media_type:
            ext = ".png"
        elif "webp" in media_type:
            ext = ".webp"
        elif "mp4" in media_type:
            ext = ".mp4"
        elif "mov" in media_type:
            ext = ".mov"

        enforce_size_limit(len(file_bytes), ext)

        target_dir = cls.get_subfolder_dir(subfolder)
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(target_dir, filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        effective_base_url = (base_url or getattr(settings, "BACKEND_BASE_URL", "")).rstrip("/")
        relative_path = f"/uploads/{subfolder}/{filename}" if subfolder != "general" else f"/uploads/{filename}"
        full_url = f"{effective_base_url}{relative_path}" if effective_base_url else relative_path
        media_category = "video" if ext in ALLOWED_VIDEO_EXTENSIONS else "image"

        return {
            "url": full_url,
            "relative_url": relative_path,
            "filename": filename,
            "media_type": media_category,
            "size": len(file_bytes),
            "status": "ok",
        }

    @classmethod
    def delete_file(cls, file_url_or_path: str) -> bool:
        if not file_url_or_path:
            return False
        try:
            # Extract path after /uploads/
            if "/uploads/" in file_url_or_path:
                rel_part = file_url_or_path.split("/uploads/", 1)[1]
                target_path = os.path.abspath(os.path.join(UPLOAD_DIR, rel_part))
            else:
                target_path = os.path.abspath(file_url_or_path)

            if target_path.startswith(os.path.abspath(UPLOAD_DIR)) and os.path.isfile(target_path):
                os.remove(target_path)
                return True
        except Exception as e:
            print(f"Failed to delete file {file_url_or_path}: {e}")
        return False
