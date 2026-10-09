# Create Post v2 — Plan

> **Status: implemented.** Deps installed (`expo-location ~57.0.20`,
> `react-native-maps 1.27.2`) with the `expo-location` config plugin in
> `app.json`; `useDeviceLocation` / `placePicker` / `places` shipped; the
> `location-picker` route is registered in `_layout.tsx`; the composer carries
> `location` + coords through draft → payload → backend; and the screen is
> redesigned (flat header + borderless caption + counter + `MediaGrid` + bottom
> dock, `LocationSheet` and `MediaRail` deleted). Verified: `tsc --noEmit` clean,
> scoped ESLint 0/0, backend `py_compile` + 10-case validation matrix green.
>
> **Follow-up (device-feedback pass):** headers on both the composer and the
> picker now use the plain-text Cancel/Share/Save style from
> `edit-profile/bio.tsx`; the picker lists **only "Use my current location" +
> previous places** (curated `SUGGESTED_PLACES` deleted); tapping a previous
> place pans the map to it; reverse-geocode now prefers venue/POI/street over
> the city; and the picker is registered as a **normal route** (not
> `fullScreenModal`) because Android turns that into a native modal where
> `react-native-maps` paints blank — the map is also no longer mounted until a
> starting region resolves. Re-verified: `tsc` + scoped ESLint clean.

Covers two workstreams:

* **A. Device location + in-app map** (Apple Maps on iOS, Google Maps on Android — never leaving the app)
* **B. Professional, minimal/borderless redesign of the composer screen**

Decisions locked with the product owner:

1. Map lives in a **full-screen location picker route** (not inside a bottom sheet).
2. Selected place stores **`location` label **and** `location_lat` / `location_lng`**.
3. Layout direction = **minimal / borderless** (hairlines, no cards, controls in a bottom dock).

---

## 0. Verified environment (docs fetched for SDK 57, not from memory)

| Fact | Value |
|------|-------|
| Expo / RN / React | `expo ~57.0.26` · RN `0.86.3` · React `19.2.3` |
| Flags | `typedRoutes: true`, `reactCompiler: true` (lint enforces purity/refs rules) |
| Native dirs | none — CNG, so all native config goes through `app.json` config plugins |
| Maps/location deps installed | none yet |
| `react-native-maps` (docs v57) | **Included in Expo Go.** Uses **Google Maps on Android** and **Apple Maps on iOS** by default — exactly the requested split. No API key needed in Expo Go; store builds need a Google Maps SDK key + config plugin on Android. |
| `expo-location` (docs v57) | Foreground permission, `getCurrentPositionAsync`, `getLastKnownPositionAsync`, `reverseGeocodeAsync`, `geocodeAsync`, `hasServicesEnabledAsync`. Android `formattedAddress` is Android-only; other address fields are cross-platform. |
| `expo-maps` (docs v57) | **Rejected** — alpha status and *not available in Expo Go*. |
| Known risk | `react-native-maps` can render **blank inside a React Native `Modal` on Android 15+** (issue #5384). Our `ComposeSheet` is an RN `Modal` → this is why the map must live in a **route**, not a sheet. |

---

## Part A — Device location + in-app map

### A1. Dependencies & config

```bash
npx expo install expo-location react-native-maps
```

`app.json`:

```jsonc
"plugins": [
  "expo-router", "expo-splash-screen", "expo-video",
  ["expo-location", {
     "locationWhenInUsePermission": "Your location is used to tag places on the posts you share."
  }]
  // Store builds only (safe to add later, harmless now):
  // ["react-native-maps", { "androidGoogleMapsApiKey": "process.env.GOOGLE_MAPS_API_KEY" }]
]
```

* No hand-editing of `ios/` / `android/` (they don't exist — CNG rule).
* Deployment note (documented, not blocking): Android **store** builds need
  Maps SDK for Android key; Expo Go ships one.

### A2. New hook — `src/hooks/useDeviceLocation.ts`

```ts
export interface DevicePlace {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  label: string | null;        // reverse-geocoded, ≤120 chars (backend limit)
  source: "gps" | "last-known" | "pin";
}

getCurrentPlace(opts?: { timeoutMs?: number }): Promise<DevicePlace>;
describeCoords(c: {latitude, longitude}): Promise<string | null>;
```

Behaviour:

1. `Location.getForegroundPermissionsAsync()` → request only if undetermined.
   * denied + `canAskAgain === false` → `showAlert(...)` with **Open Settings**
     (`Linking.openSettings()`).
   * services off (`hasServicesEnabledAsync()` false) → toast; on Android offer
     `Location.enableNetworkProviderAsync()`.
2. Fix: try `getLastKnownPositionAsync({ maxAge: 5 min, requiredAccuracy: 800 })`
   for an instant first paint, then refine with
   `getCurrentPositionAsync({ accuracy: Accuracy.Balanced })` behind an 8 s
   timeout guard. Whichever resolves wins; stale/last-known is labelled as such.
3. Label: `reverseGeocodeAsync` → build
   `name/city + ", " + region + ", " + country`
   (Android: prefer `formattedAddress`), **clamped to 120 chars**
   (backend `PostCreate.location` limit). Failures return `null` — the UI falls
   back to coordinates or the previous label, never throws.
4. Module-level reverse-geocode cache keyed at ~3 decimal places (≈100 m) so
   panning back and forth doesn't re-hit the geocoder.

### A3. New route — `src/app/location-picker.tsx` (full-screen, in-app)

Registered automatically by Expo Router; add an explicit entry in
`src/app/_layout.tsx` for a modal-style presentation:

```tsx
<Stack.Screen name="location-picker"
  options={{ animation: "slide_from_bottom", gestureEnabled: true }} />
```

**Result passing (important):** navigating `create-post → location-picker →
back()` with params would rebuild the composer and lose in-memory state.
Instead a tiny promise-based helper `src/services/placePicker.ts`:

```ts
requestPlace(initial?: { lat?: number; lng?: number; label?: string })
  : Promise<{ location: string; location_lat: number; location_lng: number } | null>
```

Route resolves the module-level promise on submit/cancel, then `router.back()`.
Composer `await`s it — draft state is untouched (and already persisted).

**UI (top → bottom):**

```
┌ Header, floating over map, translucent bg ────────────────────┐
│ ✕        Choose a place                          [ Use ] pill │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│              MAP — edge to edge, full screen                   │
│         (Apple Maps on iOS · Google Maps on Android)           │
│                    ◉ draggable pin                             │
│                                                                │
│ ┌ 🔍 Search places or cities… ─────────────────────────────┐ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌ ┌─ Card (bottom, safe-area padded, scrollable) ─────────┐  │
│ │  ⌖ Use my current location        ← GPS, spinner state  │  │
│ │  ─────────────────────────────────────────────────────  │  │
│ │  Recent places (max 5, AsyncStorage `we.places.recent`) │  │
│ │  Suggestions (curated list, filter-as-you-type)         │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Interactions:

* `MapView` with no `provider` prop → **Apple Maps on iOS, Google Maps on Android**
  (default per platform). `showsUserLocation` once permission is granted.
* `initialRegion` from the passed-in place, else last-known fix, else a wide
  default region (no crash when location is off).
* Tap / long-press map or drag the marker → move pin → `onRegionChangeComplete`
  debounced 400 ms → `describeCoords` → update the label shown in the header/CTA.
* `Use my current location` → `getCurrentPlace()` → moves pin + label.
* Search input → `geocodeAsync(query)` (rate-guarded, 400 ms debounce) merged
  with the curated suggestions list; picking a result flies the camera.
* `Use` CTA (disabled until a label or a pin exists) → resolves the promise with
  `{ location, location_lat, location_lng }` → pushes the place into the recent
  list → `router.back()`.
* States handled: permission denied (banner + Open Settings), services off,
  geocoder failure (keeps coords, label falls back to `"Pinned location"`),
  offline, loading (skeleton rows, header spinner).
* Theme: map chrome (pins/labels) is platform-styled and follows the system
  appearance (`userInterfaceStyle: automatic`); **all app chrome uses theme
  tokens only** — no hardcoded hex.

### A4. Composer integration (`create-post.tsx`)

* State: `location: string | null` → plus `place: { lat, lng } | null`.
* Location control no longer opens a sheet → `placePicker.requestPlace(...)`,
  then sets both label and coords (and applies the returned value even if the
  caption is untouched).
* Location chip: tappable (re-opens the picker with the current place), pin
  icon, remove ✕. Optional (P2): 56×56 rounded **live map thumbnail** beside
  the chip — safe, because a `MapView` outside a `Modal` has no Android bug.
* `draftService.ComposeDraft` gains `location_lat` / `location_lng`;
  auto-save, `saveNow()` and restore all carry them.
* `POPULAR_LOCATIONS` moves out of the screen into
  `src/constants/places.ts` (shared with the picker) — or dies with the sheet.
* `Sheets.tsx`: **remove `LocationSheet` + `LocationSheetBody`**; keep Privacy
  and Tags sheets.

### A5. Backend — persist coordinates

| File | Change |
|------|--------|
| `backend/shared/models.py` | `PostCreate`: `location_lat: Optional[float] = None` (−90…90), `location_lng: Optional[float] = None` (−180…180); model validator: both present together or both absent. |
| `backend/services/post_service/main.py` | copy the two fields into `post_doc`; `serialize_post()` returns them. |
| `backend/sync_engine/api_registry.py` | copy the two fields into `post_doc` (validation already flows through `PostCreate`). |

No read-path changes: `location` is already rendered by `FeedScreen` /
`post/[id]`; the coordinates become available for a future tappable place card.

`CreatePostPayload` in `postService.ts` gains `location_lat?` / `location_lng?`
and they are forwarded through all three create paths (sync → HTTP → local
fallback).

---

## Part B — Screen redesign (minimal / borderless)

### B1. Principles

1. **No cards** — the screen background plus hairline dividers
   (`colors.borderLight`) instead of nested surfaces.
2. **One type scale** — 17 body / 15 secondary / 13 caption; title 17 semibold.
3. **One primary action** — the Share pill (top-right). Everything else is
   quiet.
4. **Controls in a fixed bottom dock** (thumb reach, above the keyboard).
5. **Zero duplication** — remove the avatar ring, the mid-screen circular
   quick-row, the duplicate `3/10` counter, and the verbose draft sentence.
6. Every control ≥ 44 pt, `accessibilityLabel` on all of them, colours from
   theme tokens only (`withAlpha` for tints), works in light **and** dark.

### B2. Target layout

```
┌ Header (52pt, flat, hairline bottom) ──────────────────────────┐
│ Cancel (textSecondary)   New post (17 semibold)   [ Share ▸ ]  │
├ progress rail — only while publishing ─────────────────────────┤
│                                                                │
│  [avatar 40]  Gokul S                        [ 🌐 Public ▾ ]  │
│               @gokul                                          │
│  ───────────────────────────────────────────────────────────  │
│  What's on your mind?                    ← borderless caption,│
│                                            17/26, min 45vh,   │
│  [ 📍 Bali, Indonesia ✕ ]  [ #Travel ✕ ]   autoFocused        │
│                                   312/1000  ← counter inline, │
│  ────────────────────────────────────────── muted→warn→danger │
│  ┌────┐ ┌────┐ ┌────┐                                         │
│  │ 1  │ │ ▶  │ │ 3  │   ← media GRID, 3-up squares,          │
│  └────┘ └────┘ └────┘      order badge, ✕, duration,         │
│  ┌ + ┐                        per-tile progress overlay       │
│                                                                │
│  Draft saved                                    (13, muted)   │
│                                                                │
│                                                                │
├ ──────────────────────────────────────────────────────────── ┤
│  🖼 Gallery   📷 Camera   📍 Place   # Topic   ← bottom dock   │
│  (badge 3/10 on Gallery)                       safe-area pad  │
└──────────────────────────────────────────────────────────────┘
```

Changes vs. today:

| Area | Today | After |
|------|-------|-------|
| Surfaces | composer card + chips card + quick-row circles | flat body, hairlines only |
| Avatar | primary-coloured ring | plain 40 pt avatar |
| Audience | under the avatar, coloured pill | right-aligned in the author row, `surfaceHighlight` + hairline + chevron |
| Caption | inside a card, 14 px feel | borderless, 17/26, ~45 vh min, autoFocused |
| Counter | in the bottom bar | right under the caption, where you type (fixes F5) |
| Media | horizontal 132×176 rail | 3-up square grid + dashed add tile (same props) |
| Attachments | 4 filled circles mid-screen | flat icon+label dock at the bottom, active = primary tint |
| Media count | rail label **and** bottom bar | single badge on the Gallery button |
| Draft hint | full sentence row | one quiet muted line |
| Header | Cancel / title / Share + shadow | same, but flat with a hairline; Share becomes a compact pill |

### B3. File-level work

| File | Action |
|------|--------|
| `src/app/create-post.tsx` | Rewrite the render section only — publish, draft, upload, sheet logic stay. Replace `QuickAction` (circles) with a `DockAction` (flat icon+label, `flex:1`). |
| `src/components/compose/MediaGrid.tsx` | **New** — same props as `MediaRail` (`medias`, `progressById`, `onRemove`, `onAdd`, `max`, `countLabel`) but `flexWrap` square tiles. |
| `src/components/compose/MediaRail.tsx` | Delete once `MediaGrid` lands (only used by this screen). |
| `src/components/compose/Sheets.tsx` | Remove `LocationSheet`; keep `PrivacySheet`, `TagsSheet`, `normalizeTag`. |
| `src/services/placePicker.ts` | New promise bridge for the picker route. |
| `src/hooks/useDeviceLocation.ts` | New. |
| `src/app/location-picker.tsx` | New route. |
| `src/app/_layout.tsx` | Register `location-picker` screen options. |
| `src/constants/places.ts` | Curated city/suggestion list (moved out of the screen). |
| `src/services/draftService.ts` | Add `location_lat` / `location_lng` to `ComposeDraft`. |
| `backend/shared/models.py`, `post_service/main.py`, `sync_engine/api_registry.py` | Coordinates (A5). |
| `frontend/design/create-post-analysis-and-redesign.md` | Update after implementation (layout diagram, `LocationSheet` row, backend table). |

### B4. Motion & feel

* `LayoutAnimation` (guarded with `UIManager`) for media tile add/remove.
* Existing sheet animations untouched; haptics on chip/topic changes and pin drop.
* Press feedback: `activeOpacity` 0.7–0.85; Share pill scales subtly.
* No `Date.now()`/refs in render (react-compiler lint rules).

---

## Part C. Verification

1. `npx tsc --noEmit` → clean.
2. `npx eslint <all touched files>` → 0 errors / 0 warnings
   (`npx expo lint` over the whole repo crashes in `eslint-plugin-import`, so
   scope it to changed files).
3. Backend: `py_compile` + import both create paths + a validation matrix
   (lat/lng ranges, one-without-the-other rejected, label > 120 rejected).
4. Manual matrix: iOS + Android × light/dark ×
   {permission granted, denied, permanently denied, services off, offline} ×
   {0, 1, 10 media} × keyboard open/close × draft restore × publish failure
   retry × back-gesture during compose.
5. Expo Go smoke test (both `expo-location` and `react-native-maps` are bundled
   there, so no dev build is required to develop this).

## Part D. Build order

1. Install deps + `app.json` plugin entries.
2. `useDeviceLocation` + `placePicker` + `places.ts` + recent-places storage.
3. `location-picker` route + `_layout` entry.
4. Composer wiring (state → chips → draft → payload).
5. Backend coordinates (models → both create paths → serializer).
6. Screen redesign (header → body → dock → `MediaGrid`).
7. Delete `LocationSheet` / `MediaRail`, dead styles, `POPULAR_LOCATIONS`.
8. Typecheck + scoped lint + docs sync.

## Risks / notes

* **Android store builds** need a Google Maps SDK key (Expo Go is fine) —
  config-plugin entry documented, not blocking.
* Reverse geocoding is rate-limited by the OS → debounce 400 ms, cache, never
  call it in a render path.
* `location` label is hard-capped at **120 chars** by the backend validator.
* Panning the map while the header updates must not re-render the whole screen
  → keep map region/label state local to the picker route.
