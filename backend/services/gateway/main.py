import os
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import jwt

from shared.config import settings
from shared.database import connect_to_mongo, close_mongo_connection
from shared.redis_bus import event_bus
from shared.file_storage import FileStorage, UPLOAD_DIR
from sync_engine.engine import sync_engine
from sync_engine import api_registry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync_gateway")

def decode_auth_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return None

async def redis_invalidation_listener():
    """Listens for write_set invalidations from other services / cluster nodes."""
    logger.info("Sync Engine Redis listener active...")
    while True:
        try:
            if not event_bus.redis_client:
                await event_bus.connect()

            pubsub = event_bus.redis_client.pubsub()
            await pubsub.subscribe("channel:invalidations")

            async for raw in pubsub.listen():
                if raw["type"] == "message":
                    payload = json.loads(raw["data"])
                    write_set = set(payload.get("write_set", []))
                    if write_set:
                        await sync_engine.invalidate(write_set)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in Redis invalidation listener: {e}")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await event_bus.connect()
    invalidation_task = asyncio.create_task(redis_invalidation_listener())
    yield
    invalidation_task.cancel()
    await event_bus.disconnect()
    await close_mongo_connection()

app = FastAPI(title="Reactive Sync Gateway", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "reactive_sync_gateway",
        "registered_queries": list(sync_engine.queries.keys()),
        "registered_mutations": list(sync_engine.mutations.keys()),
        "active_subscriptions": len(sync_engine.subscriptions),
    }

@app.post("/upload")
async def upload_file(request: Request):
    content_type = request.headers.get("content-type", "")
    proto = request.headers.get("x-forwarded-proto", request.url.scheme or "http")
    host = request.headers.get("host") or "192.168.1.83:8000"
    base_url = settings.BACKEND_BASE_URL or f"{proto}://{host}"

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded_file = form.get("file")
        if not uploaded_file:
            raise HTTPException(status_code=400, detail="No file selected for upload")
        subfolder = str(form.get("folder") or "general")
        return await FileStorage.save_upload_file(uploaded_file, subfolder=subfolder, base_url=base_url)

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    data = payload.get("data", "")
    media_type = payload.get("media_type", "image/jpeg")
    subfolder = payload.get("folder", "general")

    if data.startswith("http://") or data.startswith("https://"):
        return {"url": data, "status": "ok"}

    return FileStorage.save_base64(data, media_type=media_type, subfolder=subfolder, base_url=base_url)

# HTTP fallback for queries
@app.post("/api/query")
async def http_query(payload: dict):
    query_name = payload.get("query")
    args = payload.get("args", {})
    token = payload.get("token")
    auth_user = decode_auth_token(token)
    try:
        data, _ = await sync_engine.execute_query(query_name, args, auth_user)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# HTTP fallback for mutations (still triggers real-time updates for all WebSocket subscribers!)
@app.post("/api/mutation")
async def http_mutation(payload: dict):
    mutation_name = payload.get("mutation")
    args = payload.get("args", {})
    token = payload.get("token")
    auth_user = decode_auth_token(token)
    try:
        data = await sync_engine.execute_mutation(mutation_name, args, auth_user)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.websocket("/sync")
@app.websocket("/ws")
async def websocket_sync_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    await websocket.accept()
    auth_user = decode_auth_token(token)

    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to Reactive Sync Engine",
            "authenticated": auth_user is not None
        })

        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                continue

            msg_type = msg.get("type")

            # 1. Update Auth Token dynamically
            if msg_type == "authenticate":
                auth_user = decode_auth_token(msg.get("token"))
                await websocket.send_json({
                    "type": "authenticated",
                    "status": "ok",
                    "user": auth_user
                })

            # 2. Reactive Query Subscription (useQuery)
            elif msg_type == "subscribe":
                sub_id = msg.get("subId")
                query_name = msg.get("query")
                args = msg.get("args", {})
                if not sub_id or not query_name:
                    await websocket.send_json({"type": "error", "message": "Missing subId or query"})
                    continue

                try:
                    initial_data = await sync_engine.add_subscription(
                        sub_id=sub_id,
                        websocket=websocket,
                        query_name=query_name,
                        args=args,
                        auth_user=auth_user
                    )
                    await websocket.send_text(json.dumps({
                        "type": "query_result",
                        "subId": sub_id,
                        "data": initial_data
                    }, default=str))
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "subId": sub_id,
                        "message": str(e)
                    })

            # 3. Unsubscribe
            elif msg_type == "unsubscribe":
                sub_id = msg.get("subId")
                if sub_id:
                    await sync_engine.remove_subscription(sub_id)
                    await websocket.send_json({"type": "unsubscribed", "subId": sub_id})

            # 4. Mutation Execution (useMutation)
            elif msg_type == "mutation":
                call_id = msg.get("callId")
                mutation_name = msg.get("mutation")
                args = msg.get("args", {})
                if not mutation_name:
                    await websocket.send_json({"type": "error", "message": "Missing mutation name"})
                    continue

                try:
                    result = await sync_engine.execute_mutation(mutation_name, args, auth_user)
                    await websocket.send_text(json.dumps({
                        "type": "mutation_result",
                        "callId": call_id,
                        "data": result
                    }, default=str))
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "callId": call_id,
                        "message": str(e)
                    })

            # 5. Heartbeat
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        await sync_engine.remove_websocket_subscriptions(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await sync_engine.remove_websocket_subscriptions(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.GATEWAY_PORT, reload=True)
