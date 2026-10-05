import asyncio
import json
from collections import defaultdict
from typing import Dict, Set
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map: topic -> Set of WebSockets subscribed to that topic
        self.topic_subscribers: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Map: WebSocket -> Set of topics that this WebSocket is subscribed to
        self.client_subscriptions: Dict[WebSocket, Set[str]] = defaultdict(set)
        # Lock for thread/coroutine safe operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            # Remove from all topics
            topics = self.client_subscriptions.pop(websocket, set())
            for topic in topics:
                self.topic_subscribers[topic].discard(websocket)
                if not self.topic_subscribers[topic]:
                    del self.topic_subscribers[topic]

    async def subscribe(self, websocket: WebSocket, topic: str):
        async with self._lock:
            self.topic_subscribers[topic].add(websocket)
            self.client_subscriptions[websocket].add(topic)

    async def unsubscribe(self, websocket: WebSocket, topic: str):
        async with self._lock:
            self.topic_subscribers[topic].discard(websocket)
            if not self.topic_subscribers[topic]:
                del self.topic_subscribers[topic]
            self.client_subscriptions[websocket].discard(topic)

    async def broadcast_to_topic(self, topic: str, message: dict):
        """Broadcast a message payload to all clients currently subscribed to topic"""
        async with self._lock:
            subscribers = list(self.topic_subscribers.get(topic, []))
        
        if not subscribers:
            return

        payload = json.dumps(message)
        dead_sockets = []

        for ws in subscribers:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.append(ws)

        # Cleanup any dead sockets that dropped abruptly
        for ws in dead_sockets:
            await self.disconnect(ws)

manager = ConnectionManager()
