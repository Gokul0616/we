import asyncio
import json
import logging
from typing import Any, Callable, Dict, Optional, Set
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from shared.database import get_database
from shared.redis_bus import event_bus

logger = logging.getLogger("sync_engine")

class ReactiveDBReader:
    """Wraps MongoDB operations to automatically track Read Sets for queries."""
    def __init__(self, raw_db: AsyncIOMotorDatabase, read_set: Set[str]):
        self.raw_db = raw_db
        self.read_set = read_set

    def _track(self, collection: str, doc_id: Optional[str] = None):
        self.read_set.add(f"coll:{collection}")
        if doc_id:
            self.read_set.add(f"doc:{collection}:{str(doc_id)}")

    async def get(self, collection: str, doc_id: str) -> Optional[dict]:
        self._track(collection, doc_id)
        try:
            oid = ObjectId(doc_id)
        except Exception:
            return None
        doc = await self.raw_db[collection].find_one({"_id": oid})
        if doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc

    async def find(self, collection: str, filter_dict: Optional[dict] = None, sort_field: str = "created_at", sort_order: int = -1, limit: int = 50) -> list[dict]:
        self._track(collection)
        filter_dict = filter_dict or {}
        cursor = self.raw_db[collection].find(filter_dict).sort(sort_field, sort_order).limit(limit)
        results = []
        async for doc in cursor:
            doc_id = str(doc["_id"])
            self._track(collection, doc_id)
            doc["id"] = doc_id
            del doc["_id"]
            results.append(doc)
        return results

    async def count(self, collection: str, filter_dict: Optional[dict] = None) -> int:
        self._track(collection)
        return await self.raw_db[collection].count_documents(filter_dict or {})

class ReactiveDBWriter:
    """Wraps MongoDB operations to execute mutations and track Write Sets."""
    def __init__(self, raw_db: AsyncIOMotorDatabase, write_set: Set[str]):
        self.raw_db = raw_db
        self.write_set = write_set

    def _track(self, collection: str, doc_id: Optional[str] = None):
        self.write_set.add(f"coll:{collection}")
        if doc_id:
            self.write_set.add(f"doc:{collection}:{str(doc_id)}")

    async def insert(self, collection: str, document: dict) -> str:
        result = await self.raw_db[collection].insert_one(document)
        doc_id = str(result.inserted_id)
        self._track(collection, doc_id)
        return doc_id

    async def update(self, collection: str, doc_id: str, update_dict: dict):
        try:
            oid = ObjectId(doc_id)
        except Exception:
            return
        await self.raw_db[collection].update_one({"_id": oid}, update_dict)
        self._track(collection, doc_id)

    async def delete(self, collection: str, doc_id: str):
        try:
            oid = ObjectId(doc_id)
        except Exception:
            return
        await self.raw_db[collection].delete_one({"_id": oid})
        self._track(collection, doc_id)

class QueryContext:
    def __init__(self, db: AsyncIOMotorDatabase, auth_user: Optional[dict] = None):
        self.read_set: Set[str] = set()
        self.db = ReactiveDBReader(db, self.read_set)
        self.auth_user = auth_user

class MutationContext:
    def __init__(self, db: AsyncIOMotorDatabase, auth_user: Optional[dict] = None):
        self.write_set: Set[str] = set()
        self.db = ReactiveDBWriter(db, self.write_set)
        # Also allow reading inside mutations
        self._read_set: Set[str] = set()
        self.reader = ReactiveDBReader(db, self._read_set)
        self.auth_user = auth_user

class ActiveSubscription:
    def __init__(self, sub_id: str, websocket: Any, query_name: str, args: dict, auth_user: Optional[dict]):
        self.sub_id = sub_id
        self.websocket = websocket
        self.query_name = query_name
        self.args = args
        self.auth_user = auth_user
        self.read_set: Set[str] = set()
        self.last_json: Optional[str] = None

class ReactiveSyncEngine:
    """
    Central Reactive Sync Engine.
    - Registers deterministic Queries and transactional Mutations.
    - Tracks Read Sets when queries execute.
    - Captures Write Sets when mutations commit.
    - Automatically re-computes affected queries and pushes JSON diffs over WebSockets.
    """
    def __init__(self):
        self.queries: Dict[str, Callable] = {}
        self.mutations: Dict[str, Callable] = {}
        # Active subscriptions: sub_id -> ActiveSubscription
        self.subscriptions: Dict[str, ActiveSubscription] = {}
        # Reverse map for rapid lookup: dependency tag -> set of sub_ids
        self.tag_to_subs: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()

    def query(self, name: str):
        """Decorator to register a reactive query function."""
        def decorator(fn: Callable):
            self.queries[name] = fn
            return fn
        return decorator

    def mutation(self, name: str):
        """Decorator to register a transactional mutation function."""
        def decorator(fn: Callable):
            self.mutations[name] = fn
            return fn
        return decorator

    async def execute_query(self, query_name: str, args: dict, auth_user: Optional[dict] = None) -> tuple[Any, Set[str]]:
        fn = self.queries.get(query_name)
        if not fn:
            raise ValueError(f"Unknown query: {query_name}")
        ctx = QueryContext(get_database(), auth_user=auth_user)
        result = await fn(ctx, args)
        return result, ctx.read_set

    async def execute_mutation(self, mutation_name: str, args: dict, auth_user: Optional[dict] = None) -> Any:
        fn = self.mutations.get(mutation_name)
        if not fn:
            raise ValueError(f"Unknown mutation: {mutation_name}")
        ctx = MutationContext(get_database(), auth_user=auth_user)
        result = await fn(ctx, args)

        # Broadcast Write Set to Redis so all gateway nodes invalidate matching queries
        if ctx.write_set:
            await event_bus.publish("channel:invalidations", {
                "write_set": list(ctx.write_set)
            })
            # Also invalidate locally immediately
            await self.invalidate(ctx.write_set)

        return result

    async def add_subscription(self, sub_id: str, websocket: Any, query_name: str, args: dict, auth_user: Optional[dict]) -> Any:
        result, read_set = await self.execute_query(query_name, args, auth_user)
        sub = ActiveSubscription(sub_id, websocket, query_name, args, auth_user)
        sub.read_set = read_set
        sub.last_json = json.dumps(result, default=str)

        async with self._lock:
            self.subscriptions[sub_id] = sub
            for tag in read_set:
                if tag not in self.tag_to_subs:
                    self.tag_to_subs[tag] = set()
                self.tag_to_subs[tag].add(sub_id)

        return result

    async def remove_subscription(self, sub_id: str):
        async with self._lock:
            sub = self.subscriptions.pop(sub_id, None)
            if sub:
                for tag in sub.read_set:
                    if tag in self.tag_to_subs:
                        self.tag_to_subs[tag].discard(sub_id)
                        if not self.tag_to_subs[tag]:
                            del self.tag_to_subs[tag]

    async def remove_websocket_subscriptions(self, websocket: Any):
        to_remove = []
        async with self._lock:
            for sub_id, sub in self.subscriptions.items():
                if sub.websocket == websocket:
                    to_remove.append(sub_id)

        for sub_id in to_remove:
            await self.remove_subscription(sub_id)

    async def invalidate(self, write_set: Set[str]):
        """Finds all queries whose Read Set intersects with write_set and pushes updates."""
        affected_sub_ids: Set[str] = set()
        async with self._lock:
            for tag in write_set:
                if tag in self.tag_to_subs:
                    affected_sub_ids.update(self.tag_to_subs[tag])

        if not affected_sub_ids:
            return

        for sub_id in affected_sub_ids:
            sub = self.subscriptions.get(sub_id)
            if not sub:
                continue

            try:
                # Re-run query with fresh read set tracking
                fresh_result, new_read_set = await self.execute_query(sub.query_name, sub.args, sub.auth_user)
                fresh_json = json.dumps(fresh_result, default=str)

                # Push only if data actually changed (or always for guaranteed freshness)
                if fresh_json != sub.last_json:
                    sub.last_json = fresh_json
                    # Update read set tags
                    async with self._lock:
                        for old_tag in sub.read_set - new_read_set:
                            self.tag_to_subs.get(old_tag, set()).discard(sub_id)
                        for new_tag in new_read_set - sub.read_set:
                            if new_tag not in self.tag_to_subs:
                                self.tag_to_subs[new_tag] = set()
                            self.tag_to_subs[new_tag].add(sub_id)
                        sub.read_set = new_read_set

                    # Push over WebSocket to client
                    await sub.websocket.send_text(json.dumps({
                        "type": "query_update",
                        "subId": sub.sub_id,
                        "data": fresh_result
                    }, default=str))
            except Exception as e:
                logger.error(f"Error re-running reactive query {sub.query_name} for sub {sub_id}: {e}")

sync_engine = ReactiveSyncEngine()
