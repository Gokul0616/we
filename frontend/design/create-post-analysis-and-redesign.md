# Create Post Screen — Analysis, Backend Review & Redesign

Scope: `frontend/src/app/create-post.tsx` + the backend paths it talks to
(`post_service`, `sync_engine/posts:create`, `gateway/upload`, `shared/file_storage.py`).

---

## Part 1 — How the screen works today

### 1.1 UI structure (current)

```
┌──────────────────────────────────────────┐
│ Cancel     New Post           [ Post ● ] │  fixed header (104/64px)
├──────────────────────────────────────────┤
│ (avatar) Name                            │
│          [ 🌐 Public ▾ ]  ← inline pill  │
│ ┌ privacy dropdown (pushes content) ┐    │
│ └───────────────────────────────────┘    │
│ What's on your mind?                     │
│ [location chip] [#tag chip]              │
│ ┌ media carousel ┐  (170×220 tiles)      │
│ └ add photo ┘     (120×220 dashed)       │
│ ┌ location tray (inline, pushes) ┐       │
│ ┌ tag tray (inline, pushes) ┐            │
├──────────────────────────────────────────┤
│ (🖼)(📷)(📍)(🏷)                0/1000   │  bottom toolbar
└──────────────────────────────────────────┘
```

### 1.2 Frontend issues found

| # | Severity | Issue |
|---|----------|-------|
| F1 | **High** | **Uploads are strictly sequential and silent.** `handlePublish` `for…await`s each media file. 4 photos = 4 round trips; a 10-photo post can take 30s+ with *zero* feedback beyond a spinner in the Post button. No per-file progress, no percentage, no "n of m". |
| F2 | **High** | **All-or-nothing publish.** If upload #3 fails, the whole `createPost` throws after files #1–#2 were already stored server-side. The user loses everything (state is kept, but uploaded URLs are not cached, so retry re-uploads from scratch). |
| F3 | **High** | **No draft persistence.** The discard dialog literally says *"Your draft will not be saved."* An accidental back-gesture destroys a composed post. |
| F4 | Medium | **Layout jumping pickers.** Location/tag/privacy pickers are inline cards inserted into the `ScrollView`, so opening one shoves the caption upward. Three mutually-exclusive booleans manage them. |
| F5 | Medium | **Character counter is detached** from the input — it lives in the bottom toolbar, so users typing a long caption never see it. No warning state near the 1000 limit. |
| F6 | Medium | **Video thumbnails render as images.** `AppImage` (expo-image) is pointed at a `file://…mp4` URI → broken/fallback tile. No duration shown. |
| F7 | Medium | **Deprecated Expo API:** `ImagePicker.MediaTypeOptions.All`. In SDK 57 the supported form is `mediaTypes: ['images', 'videos']`. |
| F8 | Medium | **Hardcoded header height** (`104` iOS / `64` Android) + `paddingTop: max(insets.top, 50)` — breaks on Android devices with tall status bars / cutouts and on landscape-free small phones. |
| F9 | Medium | **No media reordering, no cover selection.** Order = selection order; `media_url` (the primary/cover) is simply `media_urls[0]`. |
| F10 | Low | **No `add_to_story` toggle** although the payload, API model and DB field all support it. |
| F11 | Low | **Hardcoded location list** (8 cities) with no free-text entry, no geolocation, no search. Hardcoded tag list (8) with no custom tags. |
| F12 | Low | **`Alert.alert`** used directly — the app ships a cross-platform `showAlert()` (native iOS / Instagram-style Android dialog) and a global toast. |
| F13 | Low | Inconsistent tile sizes (170×220 vs 120×220), no accessibility labels on icon-only buttons, `Vibration` on publish but nowhere else. |
| F14 | Low | `media_type` is `"photo"` when there is **no** media at all (misleading to the feed renderer); `"carousel"` only when `>1`. |

### 1.3 Backend paths involved

```
postService.createPost()
 ├─ 1) syncClient.mutation("posts:create")   → sync_engine/api_registry.py:327
 │                                               └─ ctx.db.insert("posts") + self-notification
 ├─ 2) POST /posts                          → services/post_service/main.py:265
 │                                               └─ insert + Redis "channel:feed" POST_CREATED
 │                                                 + Redis notification worker
 └─ 3) local fallback object                → never persisted

postService.uploadMedia() → uploadFileToServer()
 └─ POST /upload (post_service:232 → gateway:85 → auth:56)
      └─ shared/file_storage.py  (extension allow-list, path-traversal guard)
```

### 1.4 Backend issues found

| # | Severity | Issue |
|---|----------|-------|
| B1 | **Critical** | **Privacy is stored but never enforced on read.** `GET /posts` (post_service:101) and `posts:getFeed` (api_registry:33) return *everything*. A post saved as `private` or `friends` is delivered to every caller. The `privacy` field is decorative today. |
| B2 | **High** | **Two divergent create paths.** The HTTP path validates local `file://` URIs and broadcasts to `channel:feed`; the sync path does *neither* (no media-URI validation, no `POST_CREATED` publish). Behaviour depends on which transport happens to win the race. |
| B3 | **High** | **No input validation at all.** `PostCreate` accepts: unlimited `content`, unlimited `media_urls`, arbitrary `privacy` string, arbitrary `media_type`, unbounded `tags`. A client can write a 10 MB caption or 500 URLs. |
| B4 | **High** | **`/upload` is unauthenticated** in all three services and `FileStorage` enforces *no size limit* → open disk-fill vector (only extension is checked). |
| B5 | Medium | **No idempotency key.** A retry after a client-side timeout creates a duplicate post. |
| B6 | Medium | **Self-notification spam.** Every publish inserts a `"Post Published!"` notification *to yourself*, which is pure noise in the notification list. |
| B7 | Medium | **Mixed-media posts are mislabelled** — the client guesses `media_type` (`carousel`/`photo`/`video`); server never derives or checks it against the actual `media_urls`. |
| B8 | Low | Feed/read responses do not include `is_liked`/`client_post_id`, and `enrich_posts_with_author_info` runs a second query per page (N+1-ish). |
| B9 | Low | Plan schema (`design/plan.md`) specifies `reposts_count`, `is_repost`, `original_post_id`, `is_deleted` — none exist in the implementation. |

---

## Part 2 — Redesign

### 2.1 Design goals

1. **Zero layout jump** — every secondary choice (audience, location, topics) opens a *bottom sheet*, never an inline block.
2. **Always-visible feedback** — determinate upload progress bar + per-tile percentage.
3. **Never lose work** — auto-saved drafts + explicit "Save Draft" on discard.
4. **One glance at state** — audience pill next to the author, char counter in the toolbar *and* colour-coded.
5. **Mobile-first, cross-platform** — safe-area driven header (no magic heights), 44pt touch targets, accessibility labels.

### 2.2 New structure

```
┌ Header (flat, hairline, like Edit Bio) ──────────────────────────┐
│ Cancel        New post                    Share                  │  ← plain text actions,
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░  Uploading 2 of 4 · 45%                    │     Share in primary colour
├──────────────────────────────────────────────────────────────────┤  ← determinate progress rail
│ (avatar 40)  Gokul S                       [ 🌐 Public ▾ ]       │  ← plain avatar, quiet audience pill
│              @gokul                                              │
│ ──────────────────────────────────────────────────────────────── │
│ What's on your mind?                                             │  ← borderless caption, 17/26,
│                                                                  │     autoFocused, min 190 pt
│ [ 📍 Bali, Indonesia ✕ ]  [ #Travel ✕ ]                          │  ← chips (place chip reopens map)
│                                                   312/1000       │  ← counter under the caption
│ ──────────────────────────────────────────────────────────────── │
│ ┌──────┐ ┌──────┐ ┌──────┐                                       │  ← MediaGrid: 3-up squares,
│ │  1   │ │ ▶12s │ │  3   │ │ +                                  │     order badge, ✕, duration,
│ └──────┘ └──────┘ └──────┘                                       │     per-tile progress
│                                                                  │
│ ☁ Draft saved                                                    │  ← quiet muted line
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  🖼 Gallery   📷 Camera   📍 Place   # Topic   ← bottom dock      │
│  (badge 3/10)                                                    │  ← safe-area padded
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Component inventory (new)

| Component | File | Responsibility |
|-----------|------|----------------|
| `ComposeSheet` | `components/compose/ComposeSheet.tsx` | Reusable bottom sheet: backdrop, drag-handle, title, close, animated slide-up, safe-area padding. |
| `MediaGrid` | `components/compose/MediaGrid.tsx` | 3-up square media tiles (viewport-sized), per-tile determinate progress, remove badge, video/duration badge, order badge, dashed "Add" tile. Replaces the old horizontal `MediaRail` (deleted). |
| `PrivacySheet` | `components/compose/Sheets.tsx` | Audience radio list + **"Also share to my story"** switch. |
| `location-picker` route | `app/location-picker.tsx` | **Full-screen in-app map** (Apple Maps on iOS / Google Maps on Android via `react-native-maps`): fixed centre pin, debounced reverse geocode (venue/street first, city last), search, "Use my current location", **previous places only** (no curated suggestions), plain-text Cancel/**Save** header like Edit Bio. Registered as a **normal card route**, not `fullScreenModal` — that falls back to a native modal on Android where `react-native-maps` renders blank. The map mounts only after a starting region resolves (param → last-known → fallback) so it no longer paints a whole-world view and then animates. |
| `useDeviceLocation` | `hooks/useDeviceLocation.ts` | Permission flow (granted/denied/blocked), services-off check, fresh fix with timeout + last-known fallback, reverse-geocoded label ≤ 120 chars with a ~100 m cache, forward-geocode search. Never throws — returns a discriminated result. |
| `placePicker` | `services/placePicker.ts` | Promise bridge: `requestPlace()` pushes the route, the route calls `settlePlace()` on confirm/cancel/unmount so the composer's state survives the round trip. Also stores the last 5 recent places. |
| `TagsSheet` | `components/compose/Sheets.tsx` | Free-form tag entry (auto-`#`), max-8 counter, suggestion grid, remove chips. |
| `draftService` | `services/draftService.ts` | AsyncStorage save/load/clear of a compose draft (debounced at call site); carries `location` + `location_lat`/`location_lng`. |

### 2.4 Behaviour changes

| Area | Before | After |
|------|--------|-------|
| Upload | Sequential, silent | **Parallel**, per-file progress, overall %, label "Uploading n of m" |
| Failure | Whole post fails, re-uploads everything | Uploaded URLs cached in state → retry only re-uploads failures |
| Drafts | "will not be saved" | Auto-save (800 ms debounce), restore on open, **Save Draft** button in discard dialog |
| Pickers | Inline, layout jump | Privacy/Topics bottom sheets; **Location → full-screen in-app map picker** |
| Location | Static suggestion list in a sheet | Device GPS (permission-aware, last-known fallback) + in-app map, **label + `location_lat`/`location_lng`** stored in draft, payload and backend |
| Surfaces | Composer card + mid-screen circle buttons | Flat body, hairline dividers, controls in a fixed bottom dock |
| Char count | Toolbar only | Directly under the caption (colour-coded), plus draft hint near limit |
| Video tile | Broken `<Image>` | Dark tile + play glyph + `mm:ss` duration |
| Picker API | `MediaTypeOptions.All` (deprecated) | `mediaTypes: ['images','videos']` |
| Header | Fixed 104/64 px | Safe-area driven `paddingTop` + `minHeight` |
| Media type | `"photo"` with 0 media | `"none"` when empty, derived consistently |
| Idempotency | none | `client_post_id` (UUID) sent with every publish |
| A11y | icon-only, unlabelled | `accessibilityLabel` on every control |

### 2.5 Colour / spacing tokens used

**Theme-adaptive rule for this screen:** every colour comes from `useTheme()` /
`constants/theme.ts` tokens — no hardcoded hex survives anywhere in
`create-post.tsx` or `components/compose/*`. The only literal colours are
`#FFFFFF` glyphs that sit **on top of a dark media overlay** inside `MediaGrid`
(order/remove/play badges), which must stay white on both themes because the
overlay itself is opaque-ish black.

`colors.primary` for primary action & selection,
`colors.card` / `colors.surface` for tiles, `colors.border` for hairlines,
`textPrimary/Secondary/Muted` for hierarchy, `colors.surfaceHighlight` for
disabled/placeholder fills (replaces the old hardcoded `#27272A` / `#E2E8F0`).
Translucent variants are built with the exported `withAlpha(color, opacity)`
helper instead of literal `rgba(...)`. Counter states:
`textMuted` → `warning` (≥ 900) → `danger` (≥ 1000).

---

## Part 3 — Backend changes implemented

| Ref | Change |
|-----|--------|
| B3 | `PostCreate` hardened: `content ≤ 1000`, content **or** media required, `privacy ∈ {public,friends,private}`, `media_type ∈ {none,photo,video,carousel}`, `media_urls ≤ 10` and every URL must be `http(s)`, `tags ≤ 8` × 30 chars. Enforced identically on the sync mutation. |
| B2 | Sync `posts:create` now performs the same media-URI validation as the HTTP path. |
| B5 | `client_post_id` idempotency key — a retry returns the already-created post instead of duplicating it (both paths). |
| B4 | `FileStorage` enforces a max upload size — images 15 MB, videos 100 MB — checked against the declared multipart length *and* the bytes actually read, plus decoded base64 payloads (`save_upload_file` / `save_base64`). |
| B7 | Server now derives `media_type` from the actual `media_urls` when the client omits/contradicts it. |
| A5 | Post **place coordinates**: `PostCreate.location_lat` / `location_lng` (−90…90 / −180…180, both-or-neither, NaN rejected), persisted in `post_doc` on **both** create paths (`post_service/main.py`, `sync_engine/api_registry.py`) and returned by `serialize_post` + both feed serializers. |

### Recommended follow-ups (not implemented — need product decisions)

* **B1 (Critical)** — enforce privacy on read: filter `GET /posts` and `posts:getFeed`
  to `privacy == "public"` **or** `author_id == me` **or** `me ∈ followers(post.author)`.
  Requires the follower graph + an optional-auth dependency on the read endpoints.
* **B4** — require a valid JWT on `/upload` in all three services (the client already
  sends `Authorization` when a token exists).
* **B6** — drop the self "Post Published!" notification (kept as-is to avoid changing
  notification semantics without sign-off).
* **B9** — implement the repost / soft-delete fields promised in `design/plan.md`.
