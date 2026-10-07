export const PRESET_AVATAR_MAP: Record<string, any> = {
  "asset:profile_avatar.jpg": require("../../assets/images/profile_avatar.jpg"),
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

export function resolveAvatarSource(avatar: any): any {
  if (!avatar) {
    return require("../../assets/images/onboarding_hero.jpg");
  }
  if (typeof avatar === "string") {
    if (avatar.startsWith("asset:") && PRESET_AVATAR_MAP[avatar]) {
      return PRESET_AVATAR_MAP[avatar];
    }
    return { uri: avatar };
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
    return { uri: cover };
  }
  return cover;
}
