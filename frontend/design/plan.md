# Project "We" — Technical Implementation Plan

Comprehensive implementation roadmap and architectural plan for the "We" mobile social media platform.

---

## 1. Executive Summary & Architecture Blueprint

```
                                 ┌─────────────────────────────────────────────────────┐
                                 │              React Native (Expo SDK 57)             │
                                 │     NativeWind v4 + expo-router/unstable-native-tabs │
                                 └──────────────────────────┬──────────────────────────┘
                                                            │
                                  Persistent WebSocket      │      REST / Multipart HTTP
                                  (/sync)                   │      (/api/v1/*, /upload/*)
                                                            ▼
                                 ┌─────────────────────────────────────────────────────┐
                                 │              Reactive Sync Gateway (:8000)          │
                                 │     - WebSocket Connection & Auth Lifecycle         │
                                 │     - Topic / Query Subscription Registry           │
                                 │     - Automatic Read/Write Set Invalidation Engine  │
                                 └──────────────────────────┬──────────────────────────┘
                                                            │
                                  Inter-Service Event Bus   │  channel:invalidations
                                  & OTP Cache (Redis 7)     │  channel:notifications
                                                            ▼
    ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
    │                           │                           │                           │
    ▼                           ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Auth Service    │    │  Post Service    │    │  DM Chat Service │    │ Notification Svc │
│  (:8001)         │    │  (:8002)         │    │  (:8000/sync)    │    │  (:8003)         │
│  - Gmail SMTP    │    │  - Carousels     │    │  - 1-on-1 DMs    │    │  - In-App Alerts │
│  - 6-digit OTP   │    │  - Video Uploads │    │  - Thread Sync   │    │  - Expo Push API │
│  - JWT Security  │    │  - Threaded Comms│    │  - Real-time WS  │    │  - Badge Counts  │
│  - Google/Apple  │    │  - Quote Reposts │    │  - Inbox Sorting │    │  - Queue Worker  │
└─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
          │                       │                       │                       │
          └───────────────────────┴───────────┬───────────┴───────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │   MongoDB Atlas ("we")  │
                                 │   - Primary ACID Data   │
                                 │   - Indexed Collections │
                                 └─────────────────────────┘
```

---

## 2. Technology Stack & Framework Specifications

| Tier | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Mobile Runtime** | Expo / React Native | Expo SDK 57, RN 0.86, React 19.2 | Cross-platform native engine |
| **Navigation** | Expo Router | `expo-router/unstable-native-tabs` | Apple Liquid Glass & Android native Material tabs |
| **Styling** | NativeWind | v4 + Tailwind CSS | Responsive, zero-runtime utility styling with dynamic dark mode |
| **Video Playback** | Expo Video | `expo-video` | Muted viewport-aware autoplay video player |
| **Backend Framework** | Python / FastAPI | Python 3.12, FastAPI 0.115+ | High-throughput async microservices & WebSocket gateway |
| **Primary Database** | MongoDB Atlas | MongoDB 8.0 (`we` DB) | Document persistence via Async Motor driver |
| **Realtime & Cache** | Redis | Redis 7.0 (systemd enabled) | Event bus, invalidation publisher, and OTP TTL store |
| **Sync Engine** | Custom Reactive Engine | Native Python / TypeScript SDK | Read/Write set tracking with auto-pushing diffs |
| **Email Verification** | Gmail SMTP | `smtplib` + Redis cache | 6-digit OTP verification pre-registration gate |
| **Push Notifications** | Expo Notifications | `expo-notifications` | Remote APNs/FCM delivery |

---

## 3. Database Schema & Index Strategy (`we` DB)

### `users`
```json
{
  "_id": "ObjectId",
  "username": "string (unique, lowercase, index: 1)",
  "email": "string (unique, lowercase, index: 1)",
  "display_name": "string",
  "password_hash": "string (Argon2id)",
  "avatar_url": "string",
  "bio": "string",
  "is_private": "boolean (default: false)",
  "google_id": "string (optional, sparse index)",
  "apple_id": "string (optional, sparse index)",
  "followers_count": "int (default: 0)",
  "following_count": "int (default: 0)",
  "created_at": "datetime"
}
```

### `posts`
```json
{
  "_id": "ObjectId",
  "author_id": "string (index: 1)",
  "author_username": "string",
  "author_avatar": "string",
  "content": "string",
  "media_type": "string ('none' | 'image' | 'video')",
  "media_urls": ["string"] (max 4 images OR 1 video),
  "likes_count": "int (default: 0)",
  "comments_count": "int (default: 0)",
  "reposts_count": "int (default: 0)",
  "is_repost": "boolean (default: false)",
  "original_post_id": "string (optional, index: 1)",
  "repost_commentary": "string (optional)",
  "is_deleted": "boolean (default: false, index: 1)",
  "created_at": "datetime (index: -1)"
}
```

### `comments`
```json
{
  "_id": "ObjectId",
  "post_id": "string (index: 1)",
  "author_id": "string",
  "author_username": "string",
  "author_avatar": "string",
  "parent_comment_id": "string (optional, for threaded replies, index: 1)",
  "content": "string",
  "is_deleted": "boolean (default: false)",
  "created_at": "datetime (index: 1)"
}
```

### `likes`
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "post_id": "string",
  "created_at": "datetime"
}
```
*(Compound Unique Index: `{ user_id: 1, post_id: 1 }`)*

### `follows`
```json
{
  "_id": "ObjectId",
  "follower_id": "string (index: 1)",
  "following_id": "string (index: 1)",
  "status": "string ('accepted' | 'pending')",
  "created_at": "datetime"
}
```
*(Compound Unique Index: `{ follower_id: 1, following_id: 1 }`)*

### `conversations`
```json
{
  "_id": "ObjectId",
  "participants": ["string", "string"] (user IDs, index: 1),
  "last_message": "string",
  "last_message_at": "datetime (index: -1)",
  "created_at": "datetime"
}
```

### `messages`
```json
{
  "_id": "ObjectId",
  "conversation_id": "string (index: 1)",
  "sender_id": "string (index: 1)",
  "text": "string",
  "created_at": "datetime (index: 1)"
}
```

### `notifications`
```json
{
  "_id": "ObjectId",
  "recipient_id": "string (index: 1)",
  "actor_id": "string",
  "actor_username": "string",
  "actor_avatar": "string",
  "type": "string ('LIKE' | 'COMMENT' | 'REPLY' | 'FOLLOW' | 'FOLLOW_REQUEST')",
  "target_id": "string",
  "read": "boolean (default: false)",
  "created_at": "datetime (index: -1)"
}
```

### `blocks` & `reports`
```json
// blocks: { blocker_id: string, blocked_id: string, created_at: datetime }
// reports: { reporter_id: string, target_type: 'post'|'user', target_id: string, reason: string, created_at: datetime }
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Design System & Native Navigation Foundation
* Install and configure **NativeWind v4** with Tailwind CSS (`tailwind.config.js`, `global.css`, `babel.config.js`).
* Configure the 4-tab native bottom navigation in `frontend/src/app/_layout.tsx` using `expo-router/unstable-native-tabs`:
  * **Home Tab** (`index.tsx`): Main feed with header branding and modal composer launcher.
  * **Explore Tab** (`explore.tsx`): Media discovery grid and user search.
  * **Messages Tab** (`messages.tsx`): 1-on-1 direct message inbox.
  * **Profile Tab** (`profile.tsx`): Profile stats, gallery grid, and account settings.
* Set up `disableTransparentOnScrollEdge` to ensure smooth Native Tabs rendering with list views.

### Phase 2: Authentication & Onboarding Pipeline
* Implement Gmail SMTP service in `backend/services/auth_service/email_otp.py`.
* Build OTP verification flow:
  1. `POST /auth/send-otp`: Generates 6-digit code, saves in Redis with 10-minute TTL, sends email.
  2. `POST /auth/verify-otp`: Validates code from Redis and issues temporary registration token.
  3. `POST /auth/register`: Completes profile, hashes password with Argon2id, and writes to MongoDB.
* Google & Apple OAuth token verification endpoints (`POST /auth/google`, `POST /auth/apple`) with automatic account linking by email.
* Store JWT tokens securely on the client with auto-login on app launch.

### Phase 3: Media Upload & Static Asset Pipeline
* Create streaming multipart upload endpoint in `backend/services/post_service/upload.py`.
* Enforce validation:
  * Images: JPEG, PNG, WEBP (Max 10MB each, up to 4 images).
  * Video: MP4, MOV (Max 30MB, duration max 60s).
* Serve uploaded media directly via FastAPI static files mounting `/uploads`.
* Build frontend image/video picker hook with progress indicator.

### Phase 4: Core Content Engine (Feed, Carousels, Video & Threaded Comments)
* Build post creation modal composer (`frontend/src/app/create.tsx`):
  * Multi-image horizontal preview / video player preview.
  * 280-character text box with live counter.
* Feed Card Component (`frontend/src/components/PostCard.tsx`):
  * Multi-image horizontal swipe carousel with dot pagination.
  * Viewport-aware autoplay video player with mute/unmute toggle.
  * Quote Repost card displaying original author and content.
* Threaded Comments Bottom Sheet:
  * Recursive/hierarchical display for replies (`parent_comment_id`).
  * Live reactive updates via `posts:getComments`.
* Like and Repost interactions with immediate reactive counter increment.

### Phase 5: Social Graph & Privacy Engine
* Implement Follow/Unfollow mutations:
  * Public account: Follow status is immediately `"accepted"`.
  * Private account: Follow status is `"pending"`; creates `FOLLOW_REQUEST` notification.
* Feed Query Privacy Gate:
  * `posts:getFeed` filters out posts from private accounts unless the viewer has an `"accepted"` follow record.
  * `explore:getTrending` strictly restricts content to public accounts only.
* Block & Report endpoints for App Store / Play Store UGC compliance.

### Phase 6: Direct Messaging Engine
* 1-on-1 Conversation screen (`frontend/src/app/chat/[id].tsx`):
  * Real-time sync via `messages:getConversation(id)` and `messages:send`.
  * Message bubbles with timestamps and delivery status.
* Inbox screen (`messages.tsx`):
  * Lists all active conversations sorted by `last_message_at`.
  * Compose modal to search users and initiate new DM threads.

### Phase 7: Explore & Search
* Sticky search header: Instant user search with live typing debounce.
* 3-column media grid ranked by engagement score:
  $$\text{Score} = \text{likes\_count} \times 2 + \text{comments\_count} \times 3$$
* Tapping any grid item opens the post detail view.

### Phase 8: Notifications & Push Delivery
* Activity Screen (`frontend/src/app/activity.tsx`):
  * Heart/Bell icon in Home header with unread count badge.
  * Filter tabs: "All", "Likes", "Comments", "Requests".
  * Direct action buttons to "Confirm" or "Delete" follow requests.
* Register device Expo Push Tokens to MongoDB user records.
* Send push notifications asynchronously via Redis worker on new DMs, likes, and follows.

### Phase 9: Testing, Optimization & Quality Bar
* Automated integration test script verifying all reactive subscriptions.
* Fast FlatList optimizations (`windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`).
* Dark/Light mode visual inspection across all screens.

---

## 5. Risk Assessment & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Server memory spike on concurrent video uploads** | High | Use async streaming chunking directly to disk (`aiofiles`), avoiding loading complete 30MB buffers into RAM. |
| **Native Tabs FlatList transparency bug on iOS** | Medium | Apply `disableTransparentOnScrollEdge` on all triggers and wrap lists with `collapsable={false}` containers. |
| **Gmail SMTP daily sending limit (500/day)** | Medium | Use Gmail for development/testing; keep SMTP settings isolated in `.env` for zero-downtime switch to Amazon SES / Resend. |
| **Expo Push Notifications in simulator** | Low | Implement in-app Activity screen first (100% functional in all environments); add APNs/FCM for physical hardware builds. |
