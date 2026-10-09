import * as Location from "expo-location";

/**
 * Device-location primitives for the compose flow.
 *
 * Everything here is async, permission-aware and non-throwing: callers get a
 * discriminated result they can render (denied / blocked / services off /
 * timeout) instead of an exception to swallow.
 */

export interface DevicePlace {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  /** Reverse-geocoded label, clamped to 120 chars (backend limit). `null` when unknown. */
  label: string | null;
  source: "gps" | "last-known";
}

export type PlaceFailureReason =
  | "denied"
  | "blocked"
  | "services-off"
  | "timeout"
  | "error";

export type PlaceResult =
  | { ok: true; place: DevicePlace }
  | { ok: false; reason: PlaceFailureReason; message: string };

export const MAX_LOCATION_LABEL = 120;

/** Reverse-geocode cache keyed at ~100 m so panning back doesn't re-hit the geocoder. */
const labelCache = new Map<string, string | null>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function clampLabel(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > MAX_LOCATION_LABEL ? trimmed.slice(0, MAX_LOCATION_LABEL) : trimmed;
}

function cleanPart(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Builds the most *specific* readable label we can from a platform placemark.
 *
 * Order matters: a mall, restaurant or landmark returns its own `name` (iOS
 * always, Android when the Geocoder resolves a POI), so we lead with that —
 * otherwise a point inside "Phoenix Marketcity" would collapse to just
 * "Chennai". We then fall back to the street address, the neighbourhood and
 * only then the city. `formattedAddress` (Android-only) is used when the
 * structured parts are too coarse and capped at 120 chars (backend limit).
 */
function buildLabel(address: Location.LocationGeocodedAddress): string | null {
  const name = cleanPart(address.name);
  const streetNumber = cleanPart(address.streetNumber);
  const street = cleanPart(address.street);
  const thoroughfare = [streetNumber, street].filter(Boolean).join(" ") || street;
  const district = cleanPart(address.district);
  const subregion = cleanPart(address.subregion);
  const city = cleanPart(address.city);
  const region = cleanPart(address.region);
  const country = cleanPart(address.country);
  const formatted = cleanPart(address.formattedAddress);

  const specific = name || thoroughfare;
  const locality = district || subregion || city;

  if (specific) {
    const parts: string[] = [];
    const push = (value: string | null) => {
      if (value && !parts.some((p) => p.toLowerCase() === value.toLowerCase())) parts.push(value);
    };
    push(specific);
    push(locality);
    push(country);
    return clampLabel(parts.slice(0, 3).join(", "));
  }

  // Nothing more specific than a city came back — the platform's formatted
  // address usually still carries the venue/street, so prefer it over a bare
  // city name.
  if (formatted) {
    const segments = formatted
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length > 0) return clampLabel(segments.slice(0, 3).join(", "));
  }

  const fallback = [locality, region, country].filter(Boolean).join(", ");
  return fallback.length > 0 ? clampLabel(fallback) : null;
}

/** Reverse-geocode a point to a short label. Returns `null` when it can't. */
export async function describeCoords(
  coordinates: { latitude: number; longitude: number }
): Promise<string | null> {
  const key = cacheKey(coordinates.latitude, coordinates.longitude);
  if (labelCache.has(key)) return labelCache.get(key) ?? null;

  let label: string | null = null;
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
    if (results && results.length > 0) label = buildLabel(results[0]);
  } catch {
    // Offline / quota / platform hiccup — the caller keeps its previous label.
    label = null;
  }

  labelCache.set(key, label);
  return label;
}

/**
 * Ensures foreground location access.
 * - `granted`  → we may read the location
 * - `denied`   → user said no but can be asked again
 * - `blocked`  → permanently denied, only OS Settings can fix it
 */
export async function ensureLocationPermission(): Promise<
  "granted" | "denied" | "blocked"
> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return "granted";
    if (!current.canAskAgain) return "blocked";

    const asked = await Location.requestForegroundPermissionsAsync();
    if (asked.granted) return "granted";
    return asked.canAskAgain ? "denied" : "blocked";
  } catch {
    return "denied";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * One-shot "where am I?" for the picker.
 *
 * Fast path is a recent last-known fix (instant map paint); a fresh
 * `Balanced` fix is tried first under a timeout so the pin is actually
 * current, and the last-known position is the fallback.
 */
export async function getCurrentPlace(options?: {
  timeoutMs?: number;
  maxAgeMs?: number;
}): Promise<PlaceResult> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const maxAgeMs = options?.maxAgeMs ?? 5 * 60 * 1000;

  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      return {
        ok: false,
        reason: "services-off",
        message: "Location services are turned off",
      };
    }

    const permission = await ensureLocationPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        reason: permission === "blocked" ? "blocked" : "denied",
        message:
          permission === "blocked"
            ? "Location access is blocked"
            : "Location permission was declined",
      };
    }

    let coordinates: { latitude: number; longitude: number; accuracy: number | null } | null =
      null;
    let source: DevicePlace["source"] = "gps";

    try {
      const fix = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeoutMs
      );
      coordinates = {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        accuracy: fix.coords.accuracy ?? null,
      };
    } catch {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: maxAgeMs,
        requiredAccuracy: 2000,
      });
      if (!lastKnown) {
        return {
          ok: false,
          reason: "timeout",
          message: "Couldn't get a location fix",
        };
      }
      coordinates = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy ?? null,
      };
      source = "last-known";
    }

    const label = await describeCoords(coordinates);
    return {
      ok: true,
      place: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy,
        label,
        source,
      },
    };
  } catch {
    return { ok: false, reason: "error", message: "Couldn't read your location" };
  }
}

/** Forward-geocode a free-text query (used by the picker's search field). */
export async function searchPlaces(
  query: string,
  options?: { limit?: number }
): Promise<{ label: string; latitude: number; longitude: number }[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = options?.limit ?? 6;
  try {
    // `geocodeAsync` returns coordinates only — no address parts — so the
    // user's own query is the most specific label we have for the result.
    const results = await Location.geocodeAsync(trimmed);
    return results.slice(0, limit).map((result) => ({
      label: clampLabel(trimmed),
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  } catch {
    return [];
  }
}
