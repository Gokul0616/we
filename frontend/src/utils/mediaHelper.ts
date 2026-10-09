import { API_CONFIG } from "../constants/api";

export const DEFAULT_AVATAR = require("../../assets/images/default_avatar.png");
export const DEFAULT_COVER = require("../../assets/images/cinque_terre_post.jpg");

export const PRESET_AVATAR_MAP: Record<string, any> = {
  "asset:default_avatar.png": DEFAULT_AVATAR,
  "asset:profile_avatar.jpg": require("../../assets/images/profile_avatar.jpg"),
  "asset:onboarding_hero.jpg": require("../../assets/images/onboarding_hero.jpg"),
  "asset:onboarding_slide_2.jpg": require("../../assets/images/onboarding_slide_2.jpg"),
  "asset:onboarding_slide_3.jpg": require("../../assets/images/onboarding_slide_3.jpg"),
  "asset:onboarding_slide_4.jpg": require("../../assets/images/onboarding_slide_4.jpg"),
  "asset:explore_food.jpg": require("../../assets/images/explore_food.jpg"),
};

export const PRESET_COVER_MAP: Record<string, any> = {
  "asset:cinque_terre_post.jpg": DEFAULT_COVER,
  "asset:home_feed_bali_post.jpg": require("../../assets/images/home_feed_bali_post.jpg"),
  "asset:explore_santorini.jpg": require("../../assets/images/explore_santorini.jpg"),
  "asset:splash_mountain.jpg": require("../../assets/images/splash_mountain.jpg"),
};

export function resolveFullUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (typeof url === "string") {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Reject raw asset: prefix from remote URL handling
    if (trimmed.startsWith("asset:")) {
      return null;
    }

    // Local device pick URIs (during immediate selection preview)
    if (trimmed.startsWith("file://") || trimmed.startsWith("content://")) {
      return trimmed;
    }

    const uploadIndex = trimmed.indexOf("/uploads/");
    if (uploadIndex !== -1) {
      // Extract just the /uploads/... part and prepend current active API gateway
      const pathPart = trimmed.substring(uploadIndex);
      return `${API_CONFIG.GATEWAY_URL}${pathPart}`;
    }

    return trimmed;
  }
  return url;
}

export function resolveAvatarSource(avatar: any): any {
  if (!avatar || avatar === "" || avatar === "null" || avatar === "undefined") {
    return DEFAULT_AVATAR;
  }

  // If already a bundled asset require() reference (number in React Native)
  if (typeof avatar === "number") {
    return avatar;
  }

  let rawString: string | null = null;
  if (typeof avatar === "string") {
    rawString = avatar.trim();
  } else if (typeof avatar === "object" && avatar !== null) {
    if (typeof avatar.uri === "string") {
      rawString = avatar.uri.trim();
    } else {
      // If it's a source object without uri, return it as-is
      return avatar;
    }
  }

  if (!rawString || rawString === "null" || rawString === "undefined" || rawString === "asset:default_avatar.png" || rawString.includes("dicebear.com")) {
    return DEFAULT_AVATAR;
  }

  // Intercept any asset: prefix — NEVER let native RCTImageLoader try to load asset:... URI
  if (rawString.startsWith("asset:")) {
    if (PRESET_AVATAR_MAP[rawString]) {
      return PRESET_AVATAR_MAP[rawString];
    }
    return DEFAULT_AVATAR;
  }

  // Handle local picked file URI (for instant local preview before upload)
  if (rawString.startsWith("file://") || rawString.startsWith("content://")) {
    return { uri: rawString };
  }

  const fullUrl = resolveFullUrl(rawString);
  if (!fullUrl) {
    return DEFAULT_AVATAR;
  }
  return { uri: fullUrl };
}

export function resolveCoverSource(cover: any): any {
  if (!cover || cover === "" || cover === "null" || cover === "undefined") {
    return DEFAULT_COVER;
  }

  if (typeof cover === "number") {
    return cover;
  }

  let rawString: string | null = null;
  if (typeof cover === "string") {
    rawString = cover.trim();
  } else if (typeof cover === "object" && cover !== null) {
    if (typeof cover.uri === "string") {
      rawString = cover.uri.trim();
    } else {
      return cover;
    }
  }

  if (!rawString || rawString === "null" || rawString === "undefined") {
    return DEFAULT_COVER;
  }

  if (rawString.startsWith("asset:")) {
    if (PRESET_COVER_MAP[rawString]) {
      return PRESET_COVER_MAP[rawString];
    }
    return DEFAULT_COVER;
  }

  if (rawString.startsWith("file://") || rawString.startsWith("content://")) {
    return { uri: rawString };
  }

  const fullUrl = resolveFullUrl(rawString);
  if (!fullUrl) {
    return DEFAULT_COVER;
  }
  return { uri: fullUrl };
}
