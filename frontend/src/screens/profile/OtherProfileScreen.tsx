import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
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
import { useTheme } from "../../context/ThemeContext";
import { PostMedia } from "../../components/common/PostMedia";
import { resolveFullUrl, resolveAvatarSource } from "../../utils/mediaHelper";

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
  type?: "photo" | "reel" | "carousel";
  caption?: string;
  created_at?: string;
  author: {
    username: string;
    fullName: string;
    avatar: any;
    isMe?: boolean;
  };
}



export function OtherProfileScreen({
  username = "alex_wanderer",
  name = "Alex Wanderer",
  avatar,
  location = "Bali, Indonesia",
  bio = "Travel & Landscape Photographer 📷\nExploring the world one cliff at a time 🌊",
  onBack,
  onMessage,
}: OtherProfileProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"Posts" | "Replies" | "Media" | "Likes">("Posts");
  const [posts, setPosts] = useState<OtherProfilePostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const PAGE_SIZE = 12;

  // Peek & Pop Preview state for Android
  const [previewPost, setPreviewPost] = useState<OtherProfilePostItem | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [postsCount, setPostsCount] = useState(0);

  const displayAvatar = targetUser?.avatar_url 
    ? resolveAvatarSource(targetUser.avatar_url) 
    : (avatar ? resolveAvatarSource(avatar) : require("../../../assets/images/home_feed_bali_post.jpg"));
  
  const displayName = targetUser?.full_name || name;
  const displayBio = targetUser?.bio || bio;
  const displayLocation = targetUser?.location || location;

  // Load real follow status and posts on mount & when active tab changes
  React.useEffect(() => {
    let isCancelled = false;
    
    // Fetch profile data
    userService.getProfile(username).then((res) => {
      if (!isCancelled && res) {
        setTargetUser(res);
      }
    });

    // Initial fetch for follow status
    userService.getFollowStatus(username).then((res) => {
      if (!isCancelled) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
        setFollowingCount(res.followingCount);
        setPostsCount(res.postsCount);
      }
    });

    // Subscribe to reactive follow status updates
    const unsubFollow = syncClient.subscribe("users:getFollowStatus", { targetUsername: username }, (res) => {
      if (!isCancelled && res) {
        if (typeof res.isFollowing === "boolean") setIsFollowing(res.isFollowing);
        if (typeof res.followersCount === "number") setFollowersCount(res.followersCount);
        if (typeof res.followingCount === "number") setFollowingCount(res.followingCount);
        if (typeof res.postsCount === "number") setPostsCount(res.postsCount);
      }
    });

    // Subscribe to reactive posts updates
    const unsubPosts = syncClient.subscribe("posts:getUserPosts", { username, tab: activeTab.toLowerCase(), limit: PAGE_SIZE, skip: 0 }, (livePosts) => {
      if (!isCancelled && Array.isArray(livePosts) && livePosts.length > 0) {
        const mapped: OtherProfilePostItem[] = livePosts.map((p: any) => ({
          id: String(p.id || p._id),
          image: p.media_url && typeof p.media_url === "string"
            ? { uri: resolveFullUrl(p.media_url) }
            : p.media_urls?.[0] && typeof p.media_urls[0] === "string"
              ? { uri: resolveFullUrl(p.media_urls[0]) }
              : null,
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          type: p.media_type || "photo",
          caption: p.content || p.caption || "",
          created_at: p.created_at || (p as any).createdAt,
          author: {
            username: p.author_username || username,
            fullName: p.author_fullName || displayName,
            avatar: p.author_avatar ? resolveAvatarSource(p.author_avatar) : displayAvatar,
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
    });

    setHasMore(true);
    loadPosts(false);

    return () => {
      isCancelled = true;
      unsubFollow();
      unsubPosts();
    };
  }, [username, activeTab]);

  const loadPosts = async (isLoadMore = false) => {
    if (isLoadingRef.current) return;
    if (isLoadMore && !hasMore) return;

    isLoadingRef.current = true;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoadingPosts(true);
    }

    try {
      const skip = isLoadMore ? posts.length : 0;
      const rawPosts = await postService.getUserPosts(username, activeTab.toLowerCase() as any, {
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
          type: p.media_type || "photo",
          caption: p.content || p.caption || "",
          created_at: p.created_at || (p as any).createdAt,
          author: {
            username: p.author_username || username,
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
          if (mapped.length > 0) {
            setPosts(mapped);
          } else if (username === "alex_wanderer") {
            setPosts(INITIAL_FALLBACK_POSTS);
          } else {
            setPosts([]);
          }
        }
        setHasMore(rawPosts.length >= PAGE_SIZE);
      } else if (!isLoadMore) {
        if (username === "alex_wanderer") {
          setPosts(INITIAL_FALLBACK_POSTS);
        } else {
          setPosts([]);
        }
      }
    } catch (e) {
      console.warn("Failed to load user posts:", e);
      if (!isLoadMore && username === "alex_wanderer") {
        setPosts(INITIAL_FALLBACK_POSTS);
      }
    } finally {
      isLoadingRef.current = false;
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  };

  const formatStatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  };

  const stats = [
    { label: "Posts", value: formatStatNumber(postsCount) },
    { label: "Followers", value: formatStatNumber(followersCount) },
    { label: "Following", value: formatStatNumber(followingCount) },
  ];

  const highlights = [
    { id: "1", title: "Bali", image: require("../../../assets/images/home_feed_bali_post.jpg") },
    { id: "2", title: "Italy", image: require("../../../assets/images/cinque_terre_post.jpg") },
    { id: "3", title: "Iceland", image: require("../../../assets/images/splash_mountain.jpg") },
    { id: "4", title: "Moments", image: require("../../../assets/images/onboarding_hero.jpg") },
  ];

  const INITIAL_FALLBACK_POSTS: OtherProfilePostItem[] = [
    {
      id: "p1",
      image: require("../../../assets/images/home_feed_bali_post.jpg"),
      likes: 4210,
      comments: 132,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p2",
      image: require("../../../assets/images/cinque_terre_post.jpg"),
      likes: 8910,
      comments: 310,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p3",
      image: require("../../../assets/images/splash_mountain.jpg"),
      likes: 5400,
      comments: 98,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p4",
      image: require("../../../assets/images/onboarding_slide_2.jpg"),
      likes: 3100,
      comments: 72,
      type: "carousel",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p5",
      image: require("../../../assets/images/onboarding_hero.jpg"),
      likes: 11200,
      comments: 480,
      type: "reel",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p6",
      image: require("../../../assets/images/onboarding_slide_3.jpg"),
      likes: 6700,
      comments: 145,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p7",
      image: require("../../../assets/images/onboarding_slide_4.jpg"),
      likes: 4900,
      comments: 112,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p8",
      image: require("../../../assets/images/home_feed_bali_post.jpg"),
      likes: 7800,
      comments: 230,
      type: "photo",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
    {
      id: "p9",
      image: require("../../../assets/images/cinque_terre_post.jpg"),
      likes: 13500,
      comments: 520,
      type: "carousel",
      author: { username, fullName: name, avatar: displayAvatar, isMe: false },
    },
  ];

  const handleToggleFollow = async () => {
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowersCount((prev) => (nextFollowing ? prev + 1 : Math.max(0, prev - 1)));
    if (nextFollowing) {
      toast.success(`Following @${username}`);
    } else {
      toast.info(`Unfollowed @${username}`);
    }

    try {
      const res = await userService.toggleFollow(username);
      setIsFollowing(res.isFollowing);
      if (typeof res.followersCount === "number") {
        setFollowersCount(res.followersCount);
      }
      if (typeof res.followingCount === "number") {
        setFollowingCount(res.followingCount);
      }
    } catch (e) {
      console.warn("Toggle follow error:", e);
    }
  };

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
    } catch (_) {}

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
    } catch (_) {}
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
        } catch (_) {}
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
        } catch (_) {}
        break;
      case "report":
        try {
          Vibration.vibrate(40);
        } catch (_) {}
        toast.info("Post reported");
        break;
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 140;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (!isLoadingRef.current && hasMore && !loadingPosts) {
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
          <Text style={[styles.headerUsername, { color: colors.textPrimary }]}>{username}</Text>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[4]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header Row: Avatar on LEFT, Stats on RIGHT */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarContainer}>
            <Image source={displayAvatar} style={styles.avatar} />
          </View>

          <View style={styles.statsContainerRight}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statColumn}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={[styles.fullName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.location, { color: colors.textSecondary }]}>{displayLocation}</Text>
          <Text style={[styles.bioText, { color: colors.textPrimary }]}>{displayBio}</Text>
        </View>

        {/* Action Buttons Row: Follow + Message */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && { backgroundColor: colors.surface }]}
            onPress={handleToggleFollow}
            activeOpacity={0.8}
          >
            <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          {onMessage && (
            <TouchableOpacity style={[styles.messageBtn, { backgroundColor: colors.surface }]} onPress={onMessage} activeOpacity={0.8}>
              <Text style={[styles.messageBtnText, { color: colors.textPrimary }]}>Message</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.suggestedUserBtn, { backgroundColor: colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="person-add-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Story Highlights Tray */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.highlightsTray}
        >
          {highlights.map((item) => (
            <View key={item.id} style={styles.highlightItem}>
              <View style={[styles.highlightRing, { borderColor: colors.borderLight }]}>
                <Image source={item.image} style={styles.highlightThumb} />
              </View>
              <Text style={[styles.highlightTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Sub Tabs: Posts | Replies | Media | Likes (Sticky below header) */}
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
                  <Text style={[
                    styles.subTabText,
                    { color: colors.textMuted },
                    isActive && { color: colors.textPrimary, fontFamily: FontFamily.semiBold }
                  ]}>
                    {tab}
                  </Text>
                  {isActive && <View style={[styles.activeTabIndicator, { backgroundColor: colors.textPrimary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3-Column Photo Grid with Native iOS Context Menu & Android Peek & Pop */}
        <View style={styles.photoGrid}>
          {posts.length === 0 && !loadingPosts ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="images-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No {activeTab} yet</Text>
              <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>When @{username} shares {activeTab.toLowerCase()}, they'll appear here.</Text>
            </View>
          ) : (
            posts.map((post) => {
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
                      <Text
                        style={[
                          styles.gridFallbackCaption,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={4}
                      >
                        {post.caption || "Text post"}
                      </Text>
                      <View
                        style={[
                          styles.gridFallbackFooter,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Ionicons name="heart" size={11} color="#EF4444" />
                        <Text
                          style={[
                            styles.gridFallbackLikes,
                            { color: colors.textMuted },
                          ]}
                        >
                          {post.likes || 0}
                        </Text>
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
          }))}
        </View>

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
                <Text style={[styles.peekUsername, { color: colors.textPrimary }]} numberOfLines={1}>
                  {previewPost.author.username}
                </Text>
              </View>

              {/* Clean Media */}
              <View style={styles.peekMediaWrapper}>
                <PostMedia
                  source={previewPost.image}
                  mediaType={previewPost.type}
                  style={styles.peekImage}
                  resizeMode="cover"
                  autoPlay={false}
                />
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
                  <Text
                    style={[
                      styles.contextMenuLabel,
                      { color: colors.textPrimary },
                      likedPosts[previewPost.id] && {
                        color: "#ED4956",
                        fontFamily: FontFamily.semiBold,
                      },
                    ]}
                  >
                    {likedPosts[previewPost.id] ? "Liked" : "Like"}
                  </Text>
                </TouchableOpacity>

                {/* Repost */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="repeat-outline" size={22} color={colors.textPrimary} />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Repost</Text>
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
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Share</Text>
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
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>View Post</Text>
                </TouchableOpacity>

                {/* Not interested */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="eye-off-outline" size={21} color={colors.textPrimary} />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Not interested</Text>
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
                  <Text style={[styles.contextMenuLabel, { color: "#ED4956" }]}>
                    Report
                  </Text>
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
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    padding: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUsername: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "#0F172A",
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
    borderColor: "#E2E8F0",
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
    color: "#0F172A",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: "#64748B",
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  fullName: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "#0F172A",
  },
  location: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: "#64748B",
    marginTop: 1,
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: "#334155",
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  followBtn: {
    flex: 1,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  followBtnText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  followingBtnText: {
    color: "#0F172A",
  },
  messageBtn: {
    flex: 1,
    height: 36,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageBtnText: {
    color: "#0F172A",
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  suggestedUserBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
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
    color: "#334155",
    textAlign: "center",
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
    borderBottomColor: "#E2E8F0",
    marginTop: 4,
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
    color: "#94A3B8",
  },
  subTabTextActive: {
    color: "#0F172A",
    fontFamily: FontFamily.bold,
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 20,
    right: 20,
    height: 2.5,
    backgroundColor: Colors.primary,
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
  // Instagram Peek & Pop Overlay
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },
  peekAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
  },
  peekUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: "#0F172A",
  },
  peekMediaWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000000",
  },
  peekImage: {
    width: "100%",
    height: "100%",
  },
  menuRowContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
  },
  instagramContextMenu: {
    width: 235,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
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
    color: "#0F172A",
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
