import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Animated,
  Vibration,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MenuView } from "@expo/ui/community/menu";
import { Colors, FontFamily } from "../../constants/theme";
import { authStorage } from "../../services/authStorage";
import { showAlert } from "../../services/alertService";
import { postService, PostItemData } from "../../services/postService";
import { PostMedia } from "../../components/common/PostMedia";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - 4) / 3;

interface HighlightItem {
  id: string;
  title: string;
  image: any;
}

export interface ProfilePostItem {
  id: string;
  image: any;
  likes: number;
  comments: number;
  type?: "photo" | "reel" | "carousel" | "video";
  caption?: string;
  location?: string;
  author: {
    username: string;
    fullName: string;
    avatar: any;
    isMe?: boolean;
  };
}

import { syncClient } from "../../services/reactiveSyncClient";
import { userService } from "../../services/userService";
import { resolveAvatarSource } from "../../utils/mediaHelper";

const tabs: Array<"Posts" | "Replies" | "Media" | "Likes"> = [
  "Posts",
  "Replies",
  "Media",
  "Likes",
];

export default function ProfileTab() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"Posts" | "Replies" | "Media" | "Likes">("Posts");
  const [refreshing, setRefreshing] = useState(false);

  // User Profile Data from Storage & Backend
  const [userProfile, setUserProfile] = useState({
    username: "",
    fullName: "",
    bio: "",
    avatar: require("../../../assets/images/onboarding_hero.jpg"),
    followers: 0,
    following: 0,
  });
  const [profilePosts, setProfilePosts] = useState<ProfilePostItem[]>([]);
  const [postsCount, setPostsCount] = useState<number>(0);

  // Peek & Pop Preview state for Android
  const [previewPost, setPreviewPost] = useState<ProfilePostItem | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Load user data once on mount and subscribe to real-time changes
  useEffect(() => {
    const updateUserState = (u: any) => {
      if (!u) return;
      setUserProfile((prev) => ({
        ...prev,
        username: u.username || prev.username,
        fullName: u.full_name || prev.fullName,
        bio: u.bio !== undefined ? u.bio : prev.bio,
        avatar: u.avatar_url ? resolveAvatarSource(u.avatar_url) : (u as any)?.avatar || prev.avatar,
        website: u.website || (prev as any).website,
        location: u.location || (prev as any).location,
      }));
    };

    authStorage.getUser().then(updateUserState);
    userService.getProfile().then(updateUserState);

    // Subscribe to instant reactive updates from Edit Profile screen & backend
    const unsubscribeUser = userService.subscribe(updateUserState);
    return () => {
      unsubscribeUser();
    };
  }, []);

  // Load posts for active tab and subscribe to reactive sync
  useEffect(() => {
    let isCancelled = false;

    loadBackendPosts(activeTab);

    // Convex-style live reactive sync subscription:
    // Syncs user posts immediately across all client devices
    const unsubscribeSync = syncClient.subscribe(
      "posts:getUserPosts",
      { username: userProfile.username, tab: activeTab.toLowerCase() },
      (livePosts: any[]) => {
        if (!isCancelled && Array.isArray(livePosts)) {
          const mapped = livePosts.map((p) => ({
            id: String(p.id || p._id),
            image: p.media_url && typeof p.media_url === "string"
              ? { uri: p.media_url }
              : p.media_urls?.[0] && typeof p.media_urls[0] === "string"
              ? { uri: p.media_urls[0] }
              : require("../../../assets/images/home_feed_bali_post.jpg"),
            likes: p.likes_count || 0,
            comments: p.comments_count || 0,
            type: p.media_type || "photo",
            caption: p.content || p.caption || "",
            location: p.location || "",
            author: {
              username: p.author_username || userProfile.username,
              fullName: userProfile.fullName,
              avatar: p.author_avatar ? (typeof p.author_avatar === "string" ? { uri: p.author_avatar } : p.author_avatar) : userProfile.avatar,
              isMe: true,
            },
          }));
          setProfilePosts(mapped);
          if (activeTab === "Posts") {
            setPostsCount(mapped.length);
          }
        }
      }
    );

    // Subscribe to newly created posts
    const unsubscribeLocal = postService.subscribe((newPost) => {
      if (!isCancelled && (activeTab === "Posts" || (activeTab === "Media" && (newPost.media_url || newPost.media_urls?.length)))) {
        const formatted: ProfilePostItem = {
          id: newPost.id,
          image: newPost.media_url
            ? { uri: newPost.media_url }
            : newPost.media_urls?.[0]
            ? { uri: newPost.media_urls[0] }
            : require("../../../assets/images/home_feed_bali_post.jpg"),
          likes: newPost.likes_count || 0,
          comments: newPost.comments_count || 0,
          type: newPost.media_type || "photo",
          caption: newPost.content || "",
          location: newPost.location || "",
          author: {
            username: newPost.author_username,
            fullName: userProfile.fullName,
            avatar: userProfile.avatar,
            isMe: true,
          },
        };

        setProfilePosts((prev) => [formatted, ...prev.filter((p) => p.id !== newPost.id)]);
        if (activeTab === "Posts") {
          setPostsCount((c) => c + 1);
        }
      }
    });

    return () => {
      isCancelled = true;
      unsubscribeSync();
      unsubscribeLocal();
    };
  }, [activeTab, userProfile.username]);

  const loadBackendPosts = async (tabToLoad = activeTab) => {
    try {
      const user = await authStorage.getUser();
      const uname = user?.username || userProfile.username;
      const fetched = await postService.getUserPosts(uname, tabToLoad.toLowerCase() as any);
      if (Array.isArray(fetched)) {
        const mapped: ProfilePostItem[] = fetched.map((p) => {
          const isMe = p.author_username === uname || p.author_id === user?.id;
          return {
            id: String(p.id),
            image: p.media_url && typeof p.media_url === "string"
              ? { uri: p.media_url }
              : p.media_urls?.[0] && typeof p.media_urls[0] === "string"
              ? { uri: p.media_urls[0] }
              : require("../../../assets/images/home_feed_bali_post.jpg"),
            likes: p.likes_count || 0,
            comments: p.comments_count || 0,
            type: p.media_type || (p.media_url?.toLowerCase().endsWith(".mp4") || p.media_url?.toLowerCase().endsWith(".mov") ? "video" : "photo"),
            caption: p.content || "",
            location: p.location || "",
            author: {
              username: p.author_username || userProfile.username,
              fullName: isMe ? userProfile.fullName : (p.author_fullName || p.author_username || "User"),
              avatar: isMe ? userProfile.avatar : (p.author_avatar ? { uri: p.author_avatar } : userProfile.avatar),
              isMe,
            },
          };
        });
        setProfilePosts(mapped);
        if (tabToLoad === "Posts") {
          setPostsCount(mapped.length);
        }
      }
    } catch (e) {
      console.warn("Error loading user posts:", e);
    }
  };

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    if (activeTab === "Media") {
      return profilePosts.filter(
        (p) => p.type === "photo" || p.type === "reel" || p.type === "carousel" || p.type === "video"
      );
    }
    // For "Posts", "Replies", and "Likes": profilePosts is already fetched accurately from backend/sync query for this activeTab
    return profilePosts;
  }, [profilePosts, activeTab]);

  const handlePostPress = (post: ProfilePostItem) => {
    const mediaUri = typeof post.image === "object" && post.image?.uri ? post.image.uri : undefined;
    const avatarUri = typeof post.author?.avatar === "object" && post.author?.avatar?.uri ? post.author.avatar.uri : undefined;
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

  const handlePostLongPress = (post: ProfilePostItem) => {
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

  const handleNativeAction = (actionId: string, post: ProfilePostItem) => {
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
        router.push("/(tabs)/messages");
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
        break;
    }
  };

  const handleSettingsPress = () => {
    showAlert(
      "Log out of your account?",
      "You will need to enter your username and password to log back in.",
      [
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await authStorage.clear();
            router.replace("/onboarding");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadBackendPosts(activeTab);
    setRefreshing(false);
  }, [activeTab]);

  const stats = [
    { label: "Posts", value: String(postsCount || (activeTab === "Posts" ? profilePosts.length : 0)) },
    { label: "Followers", value: "1.2K" },
    { label: "Following", value: "312" },
  ];

  const highlights: HighlightItem[] = [
    {
      id: "travel",
      title: "Travel",
      image: require("../../../assets/images/home_feed_bali_post.jpg"),
    },
    {
      id: "food",
      title: "Food",
      image: require("../../../assets/images/onboarding_slide_4.jpg"),
    },
    {
      id: "friends",
      title: "Friends",
      image: require("../../../assets/images/onboarding_hero.jpg"),
    },
    {
      id: "life",
      title: "Life",
      image: require("../../../assets/images/splash_mountain.jpg"),
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top Header matching Screen 06 */}
      <View style={[styles.topHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.topHeaderLeft}>
          <Image
            source={userProfile.avatar}
            style={styles.topHeaderAvatar}
          />
        </View>

        <View style={styles.topHeaderRight}>
          {/* Quick 1-Tap Theme Switcher */}
          <TouchableOpacity
            style={[styles.settingsIconBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={() => {
              try {
                Vibration.vibrate(25);
              } catch (_) {}
              toggleTheme();
            }}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={19}
              color={isDark ? "#F59E0B" : colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile")}
          >
            <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsIconBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={handleSettingsPress}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Header Row: Avatar on LEFT, Stats on RIGHT */}
        <View style={styles.profileHeaderRow}>
          <Image
            source={userProfile.avatar}
            style={styles.avatar}
          />

          <View style={styles.statsContainerRight}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statColumn}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile Bio & Details */}
        <View style={styles.bioContainer}>
          <Text style={[styles.fullName, { color: colors.textPrimary }]}>{userProfile.fullName}</Text>
          <Text style={[styles.handle, { color: colors.textSecondary }]}>@{userProfile.username}</Text>
          <Text style={[styles.bioText, { color: colors.textPrimary }]}>{userProfile.bio}</Text>
          {(userProfile as any).location ? (
            <View style={[styles.linkRow, { marginBottom: 4 }]}>
              <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>{(userProfile as any).location}</Text>
            </View>
          ) : null}
          {/* Website link row - commented out
          <View style={styles.linkRow}>
            <Ionicons name="link-outline" size={15} color={Colors.primary} />
            <Text style={styles.linkText}>{(userProfile as any).website || `we.social/@${userProfile.username}`}</Text>
          </View>
          */}
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
          <TouchableOpacity style={styles.highlightItem} activeOpacity={0.7}>
            <View style={[styles.highlightRing, styles.highlightAddRing, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="add" size={24} color={colors.textSecondary} />
            </View>
            <Text style={[styles.highlightTitle, { color: colors.textPrimary }]}>New</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sub Tabs: Posts | Replies | Media | Likes */}
        <View style={[styles.subTabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                onPress={() => {
                  if (activeTab !== tab) {
                    setProfilePosts([]);
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

        {/* 3-Column Photo Grid with Native iOS Context Menu & Android Peek & Pop */}
        {filteredPosts.length === 0 ? (
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
              color="#CBD5E1"
            />
            <Text style={styles.emptyStateTitle}>No {activeTab} yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              {activeTab === "Media"
                ? "Photos and videos you post will appear here."
                : activeTab === "Replies"
                ? "Conversations and replies will appear here."
                : activeTab === "Likes"
                ? "Posts you like will be saved to this tab."
                : "When you share photos and videos, they will appear on your profile."}
            </Text>
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
                  style={styles.gridTile}
                >
                  <PostMedia
                    source={post.image}
                    mediaType={post.type}
                    style={styles.gridImage}
                    resizeMode="cover"
                    autoPlay={false}
                    isGrid={true}
                  />
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
              style={styles.peekCard}
            >
              {/* Slim Author Header */}
              <View style={styles.peekHeader}>
                <Image
                  source={previewPost.author.avatar}
                  style={styles.peekAvatar}
                />
                <Text style={styles.peekUsername} numberOfLines={1}>
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
                  isDetailScreen
                  autoPlay={false}
                />
              </View>
            </TouchableOpacity>

            {/* 2. Floating Context Menu Row */}
            <View style={styles.menuRowContainer} pointerEvents="box-none">
              <View style={styles.instagramContextMenu}>
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
                      likedPosts[previewPost.id] ? "#ED4956" : "#0F172A"
                    }
                  />
                  <Text
                    style={[
                      styles.contextMenuLabel,
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
                  <Ionicons name="repeat-outline" size={22} color="#0F172A" />
                  <Text style={styles.contextMenuLabel}>Repost</Text>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => {
                    closePreview(() => router.push("/(tabs)/messages"));
                  }}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={21}
                    color="#0F172A"
                  />
                  <Text style={styles.contextMenuLabel}>Share</Text>
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
                    color="#0F172A"
                  />
                  <Text style={styles.contextMenuLabel}>View Post</Text>
                </TouchableOpacity>

                {/* Not interested */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="eye-off-outline" size={21} color="#0F172A" />
                  <Text style={styles.contextMenuLabel}>Not interested</Text>
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
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  topHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: "#334155",
  },
  settingsIconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  handle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: "#64748B",
    marginTop: 1,
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  highlightsTray: {
    paddingHorizontal: 20,
    paddingTop: 14,
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
  highlightAddRing: {
    backgroundColor: "#F8FAFC",
    borderStyle: "dashed",
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
  subTabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginTop: 4,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
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
    backgroundColor: "#F1F5F9",
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
  // Instagram Floating Context Menu
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: "#0F172A",
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  videoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
