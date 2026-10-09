import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

/**
 * Bridge between the composer and the full-screen `/location-picker` route.
 *
 * Navigating with params and reading them back on return would force the
 * composer to be re-created (losing in-memory state), so instead the route
 * settles a module-level promise when the user confirms or cancels. The
 * composer simply `await`s the result of `requestPlace()`.
 */

export interface PickedPlace {
  location: string;
  location_lat: number;
  location_lng: number;
}

export interface PlaceRequest {
  lat?: number;
  lng?: number;
  label?: string;
}

const RECENT_KEY = "we.places.recent.v1";
const RECENT_LIMIT = 5;

let pending: ((value: PickedPlace | null) => void) | null = null;

/** Opens the in-app map picker and resolves with the chosen place (or `null`). */
export function requestPlace(initial?: PlaceRequest): Promise<PickedPlace | null> {
  // A second request supersedes the first — never leave a dangling promise.
  if (pending) {
    const previous = pending;
    pending = null;
    previous(null);
  }

  const result = new Promise<PickedPlace | null>((resolve) => {
    pending = resolve;
  });

  const params: Record<string, string> = {};
  if (typeof initial?.lat === "number") params.lat = String(initial.lat);
  if (typeof initial?.lng === "number") params.lng = String(initial.lng);
  if (initial?.label) params.label = initial.label;

  router.push({ pathname: "/location-picker" as any, params });
  return result;
}

/** Called by the picker route: resolves the waiting composer, if any. */
export function settlePlace(place: PickedPlace | null): void {
  const resolve = pending;
  pending = null;
  resolve?.(place);
}

/* ------------------------------------------------------------------ */
/* Recently used places                                                */
/* ------------------------------------------------------------------ */

export async function getRecentPlaces(): Promise<PickedPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PickedPlace[]) : [];
  } catch {
    return [];
  }
}

export async function rememberPlace(place: PickedPlace): Promise<void> {
  try {
    const current = await getRecentPlaces();
    const next = [
      place,
      ...current.filter((item) => item.location !== place.location),
    ].slice(0, RECENT_LIMIT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recent places are a convenience — never block the picker on them.
  }
}
