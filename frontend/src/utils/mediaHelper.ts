import { API_CONFIG } from "../constants/api";

export const DEFAULT_AVATAR = require("../../assets/images/default_avatar.png");

export const PRESET_AVATAR_MAP: Record<string, any> = {
  "asset:default_avatar.png": DEFAULT_AVATAR,
  "asset:profile_avatar.jpg": require("../../assets/images/profile_avatar.jpg"),
  "asset:profile_gokul_avatar.jpg": require("../../assets/images/profile_gokul_avatar.jpg"),
  "asset:onboarding_hero.jpg": require("../../assets/images/onboarding_hero.jpg"),
  "asset:onboarding_slide_2.jpg": require("../../assets/images/onboarding_slide_2.jpg"),
  "asset:onboarding_slide_3.jpg": require("../../assets/images/onboarding_slide_3.jpg"),
  "asset:onboarding_slide_4.jpg": require("../../assets/images/onboarding_slide_4.jpg"),
  "asset:explore_food.jpg": require("../../assets/images/explore_food.jpg"),
};

export const PRESET_COVER_MAP: Record<string, any> = {
  "asset:cinque_terre_post.jpg": require("../../assets/images/cinque_terre_post.jpg"),
  "asset:home_feed_bali_post.jpg": require("../../assets/images/home_feed_bali_post.jpg"),
  "asset:explore_santorini.jpg": require("../../assets/images/explore_santorini.jpg"),
  "asset:splash_mountain.jpg": require("../../assets/images/splash_mountain.jpg"),
};

export function resolveFullUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  if (typeof url === "string") {
    const uploadIndex = url.indexOf("/uploads/");
    if (uploadIndex !== -1) {
      // Extract just the /uploads/... part and prepend the current POSTS_URL
      const pathPart = url.substring(uploadIndex);
      return `${API_CONFIG.POSTS_URL}${pathPart}`;
    }
  }
  return url;
}

export function resolveAvatarSource(avatar: any): any {
  if (!avatar || avatar === "" || avatar === "null" || avatar === "undefined") {
    return DEFAULT_AVATAR;
  }
  if (typeof avatar === "string") {
    const trimmed = avatar.trim();
    if (!trimmed || trimmed === "asset:default_avatar.png" || trimmed.includes("dicebear.com")) {
      return DEFAULT_AVATAR;
    }
    if (trimmed.startsWith("asset:") && PRESET_AVATAR_MAP[trimmed]) {
      return PRESET_AVATAR_MAP[trimmed];
    }
    const fullUrl = resolveFullUrl(trimmed);
    return { uri: fullUrl };
  }
  return avatar;
}

export function resolveCoverSource(cover: any): any {
  if (!cover) {
    return require("../../assets/images/cinque_terre_post.jpg");
  }
  if (typeof cover === "string") {
    if (cover.startsWith("asset:") && PRESET_COVER_MAP[cover]) {
      return PRESET_COVER_MAP[cover];
    }
    const fullUrl = resolveFullUrl(cover);
    return { uri: fullUrl };
  }
  return cover;
}
