import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Compose draft persistence.
 *
 * Keeps a single in-progress post draft on device so an accidental back gesture,
 * app reload or crash never destroys composed work. Media is stored as local
 * `file://` URIs (the picker's own URIs), which stay readable until the OS
 * reclaims the picker cache — good enough to survive an app restart.
 */

const DRAFT_KEY = "we.compose.draft.v1";

export interface ComposeDraft {
  caption: string;
  medias: { id: string; uri: string; type: "photo" | "video"; duration?: number }[];
  location: string | null;
  /** Device/pick coordinates for `location`; both or neither (backend rule). */
  location_lat?: number | null;
  location_lng?: number | null;
  tags: string[];
  privacy: string;
  add_to_story: boolean;
  updated_at: number;
}

export function isDraftMeaningful(draft: Partial<ComposeDraft> | null | undefined): draft is ComposeDraft {
  if (!draft) return false;
  const hasText = typeof draft.caption === "string" && draft.caption.trim().length > 0;
  const hasMedia = Array.isArray(draft.medias) && draft.medias.length > 0;
  const hasCoords =
    typeof draft.location_lat === "number" && typeof draft.location_lng === "number";
  const hasExtras =
    Boolean(draft.location) || hasCoords || (Array.isArray(draft.tags) && draft.tags.length > 0);
  return hasText || hasMedia || hasExtras;
}

class DraftService {
  /** Debounce handle so rapid keystrokes don't thrash AsyncStorage. */
  private timer: ReturnType<typeof setTimeout> | null = null;

  public async load(): Promise<ComposeDraft | null> {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ComposeDraft;
      if (!isDraftMeaningful(parsed)) return null;
      return parsed;
    } catch (e) {
      console.log("[DraftService] load failed:", e);
      return null;
    }
  }

  /**
   * Persist the draft after `delayMs` of inactivity (default 800ms).
   * Empty drafts clear storage instead of writing a useless record.
   */
  public saveDebounced(draft: Omit<ComposeDraft, "updated_at">, delayMs = 800): void {
    if (this.timer) clearTimeout(this.timer);

    if (!isDraftMeaningful(draft as Partial<ComposeDraft>)) {
      this.timer = setTimeout(() => this.clear(), delayMs);
      return;
    }

    this.timer = setTimeout(() => {
      this.write({ ...draft, updated_at: Date.now() });
    }, delayMs);
  }

  /**
   * Persist immediately (cancels any pending debounced write).
   * Used when the user explicitly taps "Save Draft" and the screen
   * unmounts right afterwards — a debounced write could be cancelled
   * by the unmount cleanup before it ever fires.
   */
  public async saveNow(draft: Omit<ComposeDraft, "updated_at">): Promise<void> {
    this.cancelPending();
    if (!isDraftMeaningful(draft as Partial<ComposeDraft>)) {
      await this.clear();
      return;
    }
    await this.write({ ...draft, updated_at: Date.now() });
  }

  private async write(draft: ComposeDraft): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.log("[DraftService] save failed:", e);
    }
  }

  /** Cancel any pending debounced write. */
  public cancelPending(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public async clear(): Promise<void> {
    this.cancelPending();
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.log("[DraftService] clear failed:", e);
    }
  }
}

export const draftService = new DraftService();
