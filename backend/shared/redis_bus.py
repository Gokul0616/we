import json
from typing import Any, AsyncGenerator, Callable
import redis.asyncio as redis
from .config import settings

class RedisEventBus:
    def __init__(self):
        self.redis_client: redis.Redis = None

    async def connect(self):
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        print(f"Connected to Redis at {settings.REDIS_URL}")

    async def disconnect(self):
        if self.redis_client:
            await self.redis_client.close()
            print("Closed Redis connection.")

    async def publish(self, channel: str, message: dict[str, Any]):
        """Publish an event payload to a Redis channel (e.g. 'channel:feed', 'channel:user:123')"""
        if not self.redis_client:
            await self.connect()
        payload = json.dumps(message)
        await self.redis_client.publish(channel, payload)

    async def subscribe(self, *channels: str) -> AsyncGenerator[tuple[str, dict[str, Any]], None]:
        """Subscribe to Redis channels and yield (channel, data) as events arrive."""
        if not self.redis_client:
            await self.connect()
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(*channels)
        try:
            async for raw_message in pubsub.listen():
                if raw_message["type"] == "message":
                    channel = raw_message["channel"]
                    try:
                        data = json.loads(raw_message["data"])
                    except Exception:
                        data = {"raw": raw_message["data"]}
                    yield channel, data
        finally:
            await pubsub.unsubscribe(*channels)
            await pubsub.close()

event_bus = RedisEventBus()
