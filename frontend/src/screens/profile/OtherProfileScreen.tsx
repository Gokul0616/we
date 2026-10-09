import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Vibration,
  Platform,
  ActivityIndicator,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MenuView } from "@expo/ui/community/menu";
import { Colors, FontFamily } from "../../constants/theme";
import { toast } from "../../services/toastService";
import { userService } from "../../services/userService";
import { postService } from "../../services/postService";
import { authStorage } from "../../services/authStorage";
import { useTheme } from "../../context/ThemeContext";
import { PostMedia } from "../../components/common/PostMedia";
import { AppText } from "../../components/common/AppText";
import { resolveFullUrl, resolveAvatarSource, DEFAULT_AVATAR } from "../../utils/mediaHelper";
import { syncClient } from "../../services/reactiveSyncClient";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - 4) / 3;

export interface OtherProfileProps {
  username?: string;
  name?: string;
  avatar?: any;
  location?: string;
  bio?: string;
  onBack: () => void;
  onMessage?: () => void;
}

export interface OtherProfilePostItem {
  id: string;
  image: any;
  likes: number;
  comments: number;
  type?: "photo" | "reel" | "carousel" | "video";
  caption?: string;
  location?: string;
  created_at?: string;
  author: {
    username: string;
    fullName: string;
    avatar: any;
    isMe?: boolean;
  };
}

export function OtherProfileScreen({
  username = "",
  name,
  avatar,
  location,
  bio,
  onBack,
  onMessage,
}: OtherProfileProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const cleanUsername = useMemo(() => {
    return (username || "").replace(/^@/, "").trim().toLowerCase();
  }, [username]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  const [activeTab, setActiveTab] = useState<"Posts" | "Replies" | "Media" | "Likes">("Posts");
  const [posts, setPosts] = useState<OtherProfilePostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingRef = useRef(false);
  const PAGE_SIZE = 12;

  // Peek & Pop Preview state for Android
  const [previewPost, setPreviewPost] = useState<OtherProfilePostItem | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Resolve user info dynamically
  const isMe = useMemo(() => {
    if (!currentUser || !cleanUsername) return false;
    return (
      currentUser.username?.toLowerCase() === cleanUsername ||
      currentUser.id === targetUser?.id
    );
  }, [currentUser, cleanUsername, targetUser]);

  const displayName = targetUser?.full_name || name || targetUser?.username || cleanUsername || "User";
  const displayBio = targetUser?.bio !== undefined ? targetUser.bio : (bio || "");
  const displayLocation = targetUser?.location !== undefined ? targetUser.location : (location || "");
  const displayAvatar = resolveAvatarSource(targetUser?.avatar_url || avatar);

  // Story highlights (demo for alex_wanderer, or real user highlights if any)
  const highlights = useMemo(() => {
    if (cleanUsername === "alex_wanderer") {
      return [
        { id: "1", title: "Bali", image: require("../../../assets/images/home_feed_bali_post.jpg") },
        { id: "2", title: "Italy", image: require("../../../assets/images/cinque_terre_post.jpg") },
        { id: "3", title: "Iceland", image: require("../../../assets/images/splash_mountain.jpg") },
        { id: "4", title: "Moments", image: require("../../../assets/images/onboarding_hero.jpg") },
      ];
    }
    return targetUser?.highlights || [];
  }, [cleanUsername, targetUser]);

  // Load current user, target profile, follow status, and posts
  useEffect(() => {
    let isCancelled = false;

    // Check logged in user
    authStorage.getUser().then((u) => {
      if (!isCancelled && u) {
        setCurrentUser(u);
      }
    });

    if (!cleanUsername) return;

    // 1. Fetch profile data
    userService.getProfile(cleanUsername).then((res) => {
      if (!isCancelled && res) {
        setTargetUser(res);
        if (typeof res.posts_count === "number") setPostsCount(res.posts_count);
        if (typeof res.followers_count === "number") setFollowersCount(res.followers_count);
        if (typeof res.following_count === "number") setFollowingCount(res.following_count);
      }
    });

    // 2. Fetch follow status
    userService.getFollowStatus(cleanUsername).then((res) => {
      if (!isCancelled && res) {
        if (typeof res.isFollowing === "boolean") setIsFollowing(res.isFollowing);
        if (typeof res.followersCount === "number") setFollowersCount(res.followersCount);
        if (typeof res.followingCount === "number") setFollowingCount(res.followingCount);
        if (typeof res.postsCount === "number") setPostsCount(res.postsCount);
      }
    });

    // 3. Subscribe to reactive follow status updates
    const unsubFollow = syncClient.subscribe("users:getFollowStatus", { targetUsername: cleanUsername }, (res: any) => {
      if (!isCancelled && res) {
        if (typeof res.isFollowing === "boolean") setIsFollowing(res.isFollowing);
        if (typeof res.followersCount === "number") setFollowersCount(res.followersCount);
        if (typeof res.followingCount === "number") setFollowingCount(res.followingCount);
        if (typeof res.postsCount === "number") setPostsCount(res.postsCount);
      }
    });

    // 4. Subscribe to reactive posts updates
    const unsubPosts = syncClient.subscribe(
      "posts:getUserPosts",
      { username: cleanUsername, tab: activeTab.toLowerCase(), limit: PAGE_SIZE, skip: 0 },
      (livePosts: any) => {
        if (!isCancelled && Array.isArray(livePosts)) {
          const mapped: OtherProfilePostItem[] = livePosts.map((p: any) => ({
            id: String(p.id || p._id),
            image: p.media_url && typeof p.media_url === "string"
              ? { uri: resolveFullUrl(p.media_url) }
              : p.media_urls?.[0] && typeof p.media_urls[0] === "string"
                ? { uri: resolveFullUrl(p.media_urls[0]) }
                : null,
            likes: p.likes_count || 0,
            comments: p.comments_count || 0,
            type: p.media_type || (p.media_url?.toLowerCase().endsWith(".mp4") || p.media_url?.toLowerCase().endsWith(".mov") ? "video" : "photo"),
            caption: p.content || p.caption || "",
            location: p.location || "",
            created_at: p.created_at || (p as any).createdAt,
            author: {
              username: p.author_username || cleanUsername,
              fullName: p.author_fullName || displayName,
              avatar: resolveAvatarSource(p.author_avatar || displayAvatar),
              isMe: false,
            },
          }));

          setPosts((prev) => {
            if (prev.length <= PAGE_SIZE) return mapped;
            const liveIds = new Set(mapped.map((p) => p.id));
            const tail = prev.filter((p) => !liveIds.has(p.id));
            return [...mapped, ...tail];
          });
        }
      }
    );

    setHasMore(true);
    loadPosts(false);

    return () => {
      isCancelled = true;
      unsubFollow();
      unsubPosts();
    };
  }, [cleanUsername, activeTab]);

  const loadPosts = async (isLoadMore = false) => {
    if (isLoadingRef.current) return;
    if (isLoadMore && !hasMore) return;
    if (!cleanUsername) {
      setLoadingPosts(false);
      return;
    }

    isLoadingRef.current = true;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoadingPosts(true);
    }

    try {
      const skip = isLoadMore ? posts.length : 0;
      const rawPosts = await postService.getUserPosts(cleanUsername, activeTab.toLowerCase() as any, {
        limit: PAGE_SIZE,
        skip,
      });

      if (Array.isArray(rawPosts)) {
        const mapped: OtherProfilePostItem[] = rawPosts.map((p: any) => ({
          id: String(p.id || p._id),
          image: p.media_url && typeof p.media_url === "string"
            ? { uri: resolveFullUrl(p.media_url) }
            : p.media_urls?.[0] && typeof p.media_urls[0] === "string"
              ? { uri: resolveFullUrl(p.media_urls[0]) }
              : null,
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          type: p.media_type || (p.media_url?.toLowerCase().endsWith(".mp4") || p.media_url?.toLowerCase().endsWith(".mov") ? "video" : "photo"),
          caption: p.content || p.caption || "",
          location: p.location || "",
          created_at: p.created_at || (p as any).createdAt,
          author: {
            username: p.author_username || cleanUsername,
            fullName: p.author_fullName || displayName,
            avatar: p.author_avatar ? resolveAvatarSource(p.author_avatar) : displayAvatar,
            isMe: false,
          },
        }));

        if (isLoadMore) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = mapped.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        } else {
          setPosts(mapped);
          if (activeTab === "Posts" && postsCount === 0 && mapped.length > 0) {
            setPostsCount(mapped.length);
          }
        }
        setHasMore(rawPosts.length >= PAGE_SIZE);
      } else if (!isLoadMore) {
        setPosts([]);
      }
    } catch (e) {
      console.log("Failed to load user posts:", e);
      if (!isLoadMore) {
        setPosts([]);
      }
    } finally {
      isLoadingRef.current = false;
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!cleanUsername) return;
    setRefreshing(true);
    setHasMore(true);
    try {
      const [profileRes, followRes] = await Promise.all([
        userService.getProfile(cleanUsername),
        userService.getFollowStatus(cleanUsername),
      ]);
      if (profileRes) {
        setTargetUser(profileRes);
        if (typeof profileRes.posts_count === "number") setPostsCount(profileRes.posts_count);
        if (typeof profileRes.followers_count === "number") setFollowersCount(profileRes.followers_count);
        if (typeof profileRes.following_count === "number") setFollowingCount(profileRes.following_count);
      }
      if (followRes) {
        if (typeof followRes.isFollowing === "boolean") setIsFollowing(followRes.isFollowing);
        if (typeof followRes.followersCount === "number") setFollowersCount(followRes.followersCount);
        if (typeof followRes.followingCount === "number") setFollowingCount(followRes.followingCount);
        if (typeof followRes.postsCount === "number") setPostsCount(followRes.postsCount);
      }
    } catch (err) {
      console.log("Error refreshing other profile:", err);
    }
    await loadPosts(false);
    setRefreshing(false);
  }, [cleanUsername, activeTab]);

  const handleToggleFollow = async () => {
    if (!cleanUsername) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowersCount((prev) => (nextFollowing ? prev + 1 : Math.max(0, prev - 1)));
    if (nextFollowing) {
      toast.success(`Following @${cleanUsername}`);
    } else {
      toast.info(`Unfollowed @${cleanUsername}`);
    }

    try {
      const res = await userService.toggleFollow(cleanUsername);
      if (typeof res.isFollowing === "boolean") setIsFollowing(res.isFollowing);
      if (typeof res.followersCount === "number") setFollowersCount(res.followersCount);
      if (typeof res.followingCount === "number") setFollowingCount(res.followingCount);
      if (typeof res.postsCount === "number") setPostsCount(res.postsCount);
    } catch (e) {
      console.log("Toggle follow error:", e);
    }
  };

  const formatStatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  };

  const stats = [
    { label: "Posts", value: formatStatNumber(postsCount || (activeTab === "Posts" ? posts.length : 0)) },
    { label: "Followers", value: formatStatNumber(followersCount) },
    { label: "Following", value: formatStatNumber(followingCount) },
  ];

  const filteredPosts = useMemo(() => {
    if (activeTab === "Media") {
      return posts.filter(
        (p) => p.type === "photo" || p.type === "reel" || p.type === "carousel" || p.type === "video" || !!p.image
      );
    }
    return posts;
  }, [posts, activeTab]);

  const handlePostPress = (post: OtherProfilePostItem) => {
    const mediaUri = typeof post.image === "object" && post.image?.uri ? post.image.uri : undefined;
    const avatarUri = typeof post.author?.avatar === "object" && post.author?.avatar?.uri
      ? post.author.avatar.uri
      : typeof post.author?.avatar === "string"
        ? post.author.avatar
        : undefined;
    router.push({
      pathname: "/post/[id]",
      params: {
        id: post.id,
        media_url: mediaUri,
        media_type: post.type || "photo",
        caption: post.caption || "",
        location: post.location || "",
        author_username: post.author.username,
        author_fullName: post.author.fullName,
        author_avatar: avatarUri,
        likes_count: String(post.likes || 0),
        comments_count: String(post.comments || 0),
      },
    });
  };

  const handlePostLongPress = (post: OtherProfilePostItem) => {
    try {
      Vibration.vibrate(35);
    } catch (_) { }

    setPreviewPost(post);
    scaleAnim.setValue(0.85);
    backdropAnim.setValue(0);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 110,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePreview = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPreviewPost(null);
      if (callback) callback();
    });
  };

  const toggleLike = (postId: string) => {
    try {
      Vibration.vibrate(25);
    } catch (_) { }
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleNativeAction = (actionId: string, post: OtherProfilePostItem) => {
    switch (actionId) {
      case "like":
        toggleLike(post.id);
        break;
      case "repost":
        try {
          Vibration.vibrate(25);
        } catch (_) { }
        toast.info("Reposted to feed");
        break;
      case "share":
        if (onMessage) onMessage();
        else router.push("/(tabs)/messages");
        break;
      case "view_post":
        handlePostPress(post);
        break;
      case "not_interested":
        try {
          Vibration.vibrate(20);
        } catch (_) { }
        break;
      case "report":
        try {
          Vibration.vibrate(40);
        } catch (_) { }
        toast.info("Post reported");
        break;
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 140;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (!isLoadingRef.current && hasMore && !loadingPosts && !refreshing) {
        loadPosts(true);
      }
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <AppText weight="bold" style={[styles.headerUsername, { color: colors.textPrimary }]} numberOfLines={1}>
            {cleanUsername ? `@${cleanUsername}` : "Profile"}
          </AppText>
          {(targetUser?.is_verified || targetUser?.verified) && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
          )}
        </View>

        {Platform.OS === "ios" ? (
          <MenuView
            actions={[
              {
                id: "share",
                title: "Share Profile",
                image: "square.and.arrow.up",
              },
              {
                id: "report",
                title: "Report Account",
                image: "exclamationmark.bubble",
                attributes: { destructive: true },
              },
              {
                id: "block",
                title: "Block User",
                image: "hand.raised",
                attributes: { destructive: true },
              },
            ]}
            onPressAction={({ nativeEvent }) => {
              if (nativeEvent.event === "share") {
                toast.success("Profile link copied!");
              } else if (nativeEvent.event === "report") {
                toast.info(`Reported @${cleanUsername}`);
              } else if (nativeEvent.event === "block") {
                toast.info(`Blocked @${cleanUsername}`);
              }
            }}
          >
            <TouchableOpacity
              style={styles.moreBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </MenuView>
        ) : (
          <TouchableOpacity
            style={styles.moreBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            onPress={() => toast.success("Profile options")}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[1]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Child 0: Profile Header & Details Section */}
        <View style={{ width: "100%" }}>
          {/* Profile Header Row: Avatar on LEFT, Stats on RIGHT */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarContainer}>
              <Image source={displayAvatar} style={[styles.avatar, { borderColor: colors.border }]} />
            </View>

            <View style={styles.statsContainerRight}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statColumn}>
                  <AppText weight="bold" style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioContainer}>
            <AppText weight="bold" style={[styles.fullName, { color: colors.textPrimary }]}>{displayName}</AppText>
            {cleanUsername ? (
              <AppText style={[styles.handle, { color: colors.textSecondary }]}>@{cleanUsername}</AppText>
            ) : null}
            {displayLocation ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginRight: 3 }} />
                <AppText style={[styles.location, { color: colors.textSecondary }]}>{displayLocation}</AppText>
              </View>
            ) : null}
            {displayBio ? (
              <AppText style={[styles.bioText, { color: colors.textPrimary }]}>{displayBio}</AppText>
            ) : null}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {isMe ? (
              <>
                <TouchableOpacity
                  style={[styles.followBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => router.push("/edit-profile" as any)}
                  activeOpacity={0.8}
                >
                  <AppText weight="semiBold" style={[styles.followBtnText, { color: colors.textPrimary }]}>
                    Edit Profile
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => toast.success("Profile link copied!")}
                  activeOpacity={0.8}
                >
                  <AppText weight="semiBold" style={[styles.messageBtnText, { color: colors.textPrimary }]}>
                    Share Profile
                  </AppText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    { backgroundColor: isFollowing ? colors.surface : colors.primary },
                    isFollowing && { borderWidth: 1, borderColor: colors.border },
                  ]}
                  onPress={handleToggleFollow}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <AppText
                    weight="semiBold"
                    style={[
                      styles.followBtnText,
                      { color: isFollowing ? colors.textPrimary : "#FFFFFF" },
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => {
                    if (onMessage) {
                      onMessage();
                    } else {
                      router.push({ pathname: "/(tabs)/messages", params: { recipient: cleanUsername } } as any);
                    }
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <AppText weight="semiBold" style={[styles.messageBtnText, { color: colors.textPrimary }]}>
                    Message
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.suggestedUserBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/search" as any)}
                >
                  <Ionicons name="person-add-outline" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Story Highlights Tray (only shown if highlights exist) */}
          {highlights.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsTray}
            >
              {highlights.map((item: any) => (
                <View key={item.id} style={styles.highlightItem}>
                  <View style={[styles.highlightRing, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                    <Image source={item.image} style={styles.highlightThumb} />
                  </View>
                  <AppText weight="medium" style={[styles.highlightTitle, { color: colors.textPrimary }]}>{item.title}</AppText>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Child 1: Sticky Sub Tabs */}
        <View style={{ zIndex: 10, elevation: 4, backgroundColor: colors.background, width: "100%" }}>
          <View
            style={[
              styles.subTabsContainer,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
                flexDirection: "row",
                width: "100%",
              },
            ]}
          >
            {(["Posts", "Replies", "Media", "Likes"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                  onPress={() => {
                    if (activeTab !== tab) {
                      setPosts([]);
                      setHasMore(true);
                      setActiveTab(tab);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <AppText
                    weight={isActive ? "semiBold" : "medium"}
                    style={[
                      styles.subTabText,
                      { color: colors.textMuted },
                      isActive && { color: colors.textPrimary },
                    ]}
                  >
                    {tab}
                  </AppText>
                  {isActive && <View style={[styles.activeTabIndicator, { backgroundColor: colors.textPrimary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Child 2: Posts Grid or Empty State */}
        {loadingPosts && posts.length === 0 ? (
          <View style={styles.initialLoaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name={
                activeTab === "Media"
                  ? "images-outline"
                  : activeTab === "Replies"
                    ? "chatbubbles-outline"
                    : activeTab === "Likes"
                      ? "heart-outline"
                      : "camera-outline"
              }
              size={48}
              color={colors.textMuted}
            />
            <AppText weight="bold" style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
              No {activeTab} yet
            </AppText>
            <AppText style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
              {activeTab === "Media"
                ? `Photos and videos shared by @${cleanUsername || "user"} will appear here.`
                : activeTab === "Replies"
                  ? `Replies by @${cleanUsername || "user"} will appear here.`
                  : activeTab === "Likes"
                    ? `Posts liked by @${cleanUsername || "user"} will appear here.`
                    : `When @${cleanUsername || "user"} shares photos and videos, they will appear here.`}
            </AppText>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {filteredPosts.map((post) => {
              const isLiked = !!likedPosts[post.id];

              const tileContent = (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handlePostPress(post)}
                  onLongPress={Platform.OS === "ios" ? undefined : () => handlePostLongPress(post)}
                  delayLongPress={180}
                  style={[styles.gridTile, { backgroundColor: colors.surface }]}
                >
                  {post.image ? (
                    <PostMedia
                      source={post.image}
                      mediaType={post.type}
                      style={styles.gridImage}
                      resizeMode="cover"
                      autoPlay={false}
                      isGrid={true}
                    />
                  ) : (
                    <View
                      style={[
                        styles.gridFallbackCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.gridFallbackTop}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={15}
                          color={colors.textSecondary}
                        />
                      </View>
                      <AppText
                        style={[
                          styles.gridFallbackCaption,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={4}
                      >
                        {post.caption || "Text post"}
                      </AppText>
                      <View
                        style={[
                          styles.gridFallbackFooter,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Ionicons name="heart" size={11} color="#EF4444" />
                        <AppText
                          style={[
                            styles.gridFallbackLikes,
                            { color: colors.textMuted },
                          ]}
                        >
                          {post.likes || 0}
                        </AppText>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );

              // iOS Native: UIContextMenu via MenuView
              if (Platform.OS === "ios") {
                return (
                  <MenuView
                    key={post.id}
                    shouldOpenOnLongPress={true}
                    actions={[
                      {
                        id: "like",
                        title: isLiked ? "Unlike" : "Like",
                        image: isLiked ? "heart.fill" : "heart",
                      },
                      {
                        id: "repost",
                        title: "Repost",
                        image: "arrow.2.squarepath",
                      },
                      {
                        id: "share",
                        title: "Share",
                        image: "paperplane",
                      },
                      {
                        id: "view_post",
                        title: "View Post",
                        image: "eye",
                      },
                      {
                        id: "not_interested",
                        title: "Not interested",
                        image: "eye.slash",
                      },
                      {
                        id: "report",
                        title: "Report",
                        image: "exclamationmark.bubble",
                        attributes: {
                          destructive: true,
                        },
                      },
                    ]}
                    onPressAction={({ nativeEvent }) => {
                      handleNativeAction(nativeEvent.event, post);
                    }}
                    style={{ width: TILE_SIZE, height: TILE_SIZE }}
                  >
                    {tileContent}
                  </MenuView>
                );
              }

              // Android: Custom touchable tile
              return (
                <React.Fragment key={post.id}>
                  {tileContent}
                </React.Fragment>
              );
            })}
          </View>
        )}

        {/* Loading more indicator at bottom of ScrollView */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* Android: Instagram Style Animated Peek & Pop Quick Preview (Long Press) */}
      {previewPost && Platform.OS !== "ios" && (
        <Animated.View
          style={[
            styles.peekOverlay,
            {
              opacity: backdropAnim,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Dark Background Overlay with Tap to Dismiss */}
          <TouchableOpacity
            style={styles.peekBackdrop}
            activeOpacity={1}
            onPress={() => closePreview()}
          />

          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.peekCardContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* 1. Floating Post Card (Slim header + Pure media) */}
            <TouchableOpacity
              activeOpacity={0.96}
              onPress={() =>
                closePreview(() => handlePostPress(previewPost))
              }
              style={[styles.peekCard, { backgroundColor: colors.surface }]}
            >
              {/* Slim Author Header */}
              <View style={[styles.peekHeader, { backgroundColor: colors.surface }]}>
                <Image
                  source={previewPost.author.avatar}
                  style={styles.peekAvatar}
                />
                <AppText weight="bold" style={[styles.peekUsername, { color: colors.textPrimary }]} numberOfLines={1}>
                  {previewPost.author.username}
                </AppText>
              </View>

              {/* Clean Media or Fallback */}
              <View style={[styles.peekMediaWrapper, { backgroundColor: colors.card }]}>
                {previewPost.image ? (
                  <PostMedia
                    source={previewPost.image}
                    mediaType={previewPost.type}
                    style={styles.peekImage}
                    resizeMode="cover"
                    isDetailScreen
                    autoPlay={false}
                  />
                ) : (
                  <View style={[styles.peekTextCard, { backgroundColor: colors.surface }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.textSecondary} style={{ marginBottom: 10 }} />
                    <AppText style={[styles.peekTextContent, { color: colors.textPrimary }]}>
                      {previewPost.caption || "Text post"}
                    </AppText>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 2. Floating Context Menu Row */}
            <View style={styles.menuRowContainer} pointerEvents="box-none">
              <View style={[
                styles.instagramContextMenu,
                { backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)" }
              ]}>
                {/* Like */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => toggleLike(previewPost.id)}
                >
                  <Ionicons
                    name={
                      likedPosts[previewPost.id] ? "heart" : "heart-outline"
                    }
                    size={22}
                    color={
                      likedPosts[previewPost.id] ? "#ED4956" : colors.textPrimary
                    }
                  />
                  <AppText
                    weight={likedPosts[previewPost.id] ? "semiBold" : "medium"}
                    style={[
                      styles.contextMenuLabel,
                      { color: colors.textPrimary },
                      likedPosts[previewPost.id] && {
                        color: "#ED4956",
                      },
                    ]}
                  >
                    {likedPosts[previewPost.id] ? "Liked" : "Like"}
                  </AppText>
                </TouchableOpacity>

                {/* Repost */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="repeat-outline" size={22} color={colors.textPrimary} />
                  <AppText weight="medium" style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Repost</AppText>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => {
                    closePreview(() => {
                      if (onMessage) onMessage();
                      else router.push("/(tabs)/messages");
                    });
                  }}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={21}
                    color={colors.textPrimary}
                  />
                  <AppText weight="medium" style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Share</AppText>
                </TouchableOpacity>

                {/* View Post */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() =>
                    closePreview(() => handlePostPress(previewPost))
                  }
                >
                  <Ionicons
                    name="eye-outline"
                    size={22}
                    color={colors.textPrimary}
                  />
                  <AppText weight="medium" style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>View Post</AppText>
                </TouchableOpacity>

                {/* Not interested */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="eye-off-outline" size={21} color={colors.textPrimary} />
                  <AppText weight="medium" style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Not interested</AppText>
                </TouchableOpacity>

                {/* Report */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color="#ED4956"
                  />
                  <AppText weight="medium" style={[styles.contextMenuLabel, { color: "#ED4956" }]}>
                    Report
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Tapping to the side closes */}
              <TouchableOpacity
                style={styles.menuSideDismiss}
                activeOpacity={1}
                onPress={() => closePreview()}
              />
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "70%",
  },
  headerUsername: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  moreBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
  },
  statsContainerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 24,
  },
  statColumn: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  fullName: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  handle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 1,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  bioText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  followBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  followBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  messageBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  suggestedUserBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  highlightsTray: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  highlightItem: {
    alignItems: "center",
    width: 66,
  },
  highlightRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  highlightThumb: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
  },
  highlightTitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: "center",
  },
  initialLoaderContainer: {
    width: "100%",
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreContainer: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  subTabsContainer: {
    flexDirection: "row",
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  subTabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  subTabItemActive: {},
  subTabText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 20,
    right: 20,
    height: 2.5,
    borderRadius: 1.5,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginTop: 2,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  gridFallbackCard: {
    flex: 1,
    width: "100%",
    height: "100%",
    padding: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 4,
  },
  gridFallbackTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridFallbackCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    marginVertical: 4,
  },
  gridFallbackFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
  },
  gridFallbackLikes: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  peekOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  peekBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  peekCardContainer: {
    width: "100%",
    maxWidth: 340,
    alignItems: "flex-start",
  },
  peekCard: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 22,
  },
  peekHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  peekAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  peekUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  peekMediaWrapper: {
    width: "100%",
    aspectRatio: 1,
  },
  peekImage: {
    width: "100%",
    height: "100%",
  },
  peekTextCard: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  peekTextContent: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    textAlign: "center",
    lineHeight: 22,
  },
  menuRowContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
  },
  instagramContextMenu: {
    width: 235,
    borderRadius: 22,
    paddingVertical: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
  },
  menuSideDismiss: {
    flex: 1,
    alignSelf: "stretch",
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 13,
  },
  contextMenuLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  emptyStateContainer: {
    width: "100%",
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    marginTop: 12,
  },
  emptyStateSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
