# Reactive Real-Time Sync Engine

A custom-built, full-stack reactive sync engine for **Python (FastAPI)**, **MongoDB**, and **Redis** providing automatic, zero-reload real-time reactivity without manual event-channel plumbing.

---

## 🔬 How The Reactive Sync Engine Works

The architecture functions as a **reactive database execution engine**:

1. **Deterministic Queries**:
   - Queries are pure functions that read from the database (`ctx.db.find(...)`, `ctx.db.get(...)`).
2. **Automatic Dependency Tracking ("Read Sets")**:
   - As a query executes, the engine intercepts all database reads and builds a **Read Set** (e.g. `['coll:posts', 'doc:posts:123']`).
   - The query result is sent to the client, and the server registers the subscription along with its Read Set.
3. **Transactional Mutations ("Write Sets")**:
   - Mutations write to the database (`ctx.db.insert(...)`, `ctx.db.update(...)`).
   - When a mutation commits, the engine records its **Write Set** (the collections and documents modified).
4. **Automatic Invalidation & Push (No Manual Glue Code)**:
   - The engine checks which active client subscriptions have a Read Set intersecting with the Write Set (`ReadSet ∩ WriteSet ≠ ∅`).
   - The engine automatically re-runs **only the affected queries** on the server and pushes the fresh data over the persistent WebSocket.
   - The client UI updates instantly with **zero page reload**.

---

## ⚡ Unified Reactive Sync Engine

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Native (Expo)                             │
│                                                                        │
│   const posts = useQuery("posts:getFeed", { limit: 20 });              │
│   const createPost = useMutation("posts:create");                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Persistent WebSocket (/sync)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Reactive Sync Gateway (:8000)                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      Sync Engine Manager                       │   │
│   │  - Tracks active subscriptions & their Read Sets               │   │
│   │  - Tag-to-Subscription Inverted Index                          │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                       Inter-Service Event Bus (Redis)
                       channel:invalidations (Write Sets)
                                    │
     ┌──────────────────────────────┴──────────────────────────────┐
     │                                                             │
     ▼                                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Post Service Mutations    │             │     User & Auth Mutations     │
│  - Executes ctx.db.insert()   │             │  - Executes ctx.db.update()   │
│  - Captures Write Set         │             │  - Captures Write Set         │
│  - Publishes invalidations    │             │  - Publishes invalidations    │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                            ┌─────────────────────┐
                            │  MongoDB (Atlas)    │
                            │  Persistent Storage │
                            └─────────────────────┘
```

---

## 💻 Developer Experience

### Defining Backend APIs (No custom socket/event code!)

In [backend/sync_engine/api_registry.py](file:///home/ssb/Desktop/Metaspaces/social/backend/sync_engine/api_registry.py):

```python
# 1. Define a Query
@sync_engine.query("posts:getFeed")
async def get_feed(ctx: QueryContext, args: dict):
    # ctx.db automatically records the Read Set!
    return await ctx.db.find("posts", {}, limit=args.get("limit", 20))

# 2. Define a Mutation
@sync_engine.mutation("posts:create")
async def create_post(ctx: MutationContext, args: dict):
    # ctx.db automatically records Write Set & triggers real-time pushes
    return await ctx.db.insert("posts", {
        "content": args["content"],
        "author_id": ctx.auth_user["sub"],
        "created_at": datetime.now(timezone.utc)
    })
```

### Using in React Native / Expo Frontend

In any component:

```tsx
import { useQuery, useMutation } from "../hooks/useSync";

export default function FeedScreen() {
  // ⚡ Automatically updates in real time whenever the DB changes
  const posts = useQuery("posts:getFeed", { limit: 20 });
  const createPost = useMutation("posts:create");
  const likePost = useMutation("posts:like");

  return (
    <View>
      <Button title="Post" onPress={() => createPost({ content: "Hello world!" })} />
      {posts?.map(post => (
        <PostItem key={post.id} post={post} onLike={() => likePost({ postId: post.id })} />
      ))}
    </View>
  );
}
```

---

## 🚀 Running the Engine

```bash
cd backend
./venv/bin/python run_services.py
```
