import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
  Dimensions,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";
import { postService, PostItemData } from "../../services/postService";
import { syncClient } from "../../services/reactiveSyncClient";

import { ExplorePost } from "../explore/ExploreScreen";
import { PostMedia } from "../../components/common/PostMedia";
import { FeedActivityIndicator } from "../../components/feed/FeedActivityIndicator";
import { authStorage, StoredUser } from "../../services/authStorage";
import { useTheme } from "../../context/ThemeContext";
import { resolveAvatarSource, resolveFullUrl, DEFAULT_AVATAR } from "../../utils/mediaHelper";
import { userService } from "../../services/userService";
import { useNotifications } from "../../context/NotificationContext";

// --- START: Extracted Memoized Post Component ---
const PostCardItem = React.memo(({ 
  item, 
  currentUser, 
  colors, 
  handleToggleLike, 
  handleToggleSave 
}: { 
  item: PostItem; 
  currentUser: StoredUser | null;
  colors: any;
  handleToggleLike: (id: string) => void;
  handleToggleSave: (id: string) => void;
}) => {
  const router = useRouter();
  
  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          activeOpacity={0.7}
          onPress={() => {
            if (currentUser?.username && currentUser.username === item.author.username) {
              router.push("/(tabs)/profile");
            } else {
              router.push({
                pathname: "/user-profile",
                params: {
                  username: item.author.username,
                  name: item.author.username.replace("_", " ").replace(".", " ").toUpperCase(),
                  location: item.author.location || "",
                },
              });
            }
          }}
        >
          <Image source={item.author.avatar} style={styles.authorAvatar} />
          <View style={styles.authorInfo}>
            <View style={styles.nameTimeRow}>
              <Text style={[styles.authorUsername, { color: colors.textPrimary }]}>{item.author.username}</Text>
              <Text style={styles.timeDot}>•</Text>
              <Text style={[styles.postTime, { color: colors.textMuted }]}>{item.timeAgo}</Text>
            </View>
            {item.author.location ? (
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{item.author.location}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Image with Rounded Corners & Indicator */}
      <View style={{ position: "relative", zIndex: 10 }}>
        <TouchableOpacity
          style={[styles.imageWrapper, { backgroundColor: colors.surface }]}
          activeOpacity={0.94}
          onPress={() => {
            const mediaUri = typeof item.image === "object" && item.image?.uri ? item.image.uri : undefined;
            const avatarUri = typeof item.author?.avatar === "object" && item.author?.avatar?.uri ? item.author.avatar.uri : undefined;
            router.push({
              pathname: "/post/[id]",
              params: {
                id: item.id,
                media_url: mediaUri,
                caption: item.caption || "",
                location: item.location || "",
                author_username: item.author?.username || "",
                author_fullName: item.author?.fullName || "",
                author_avatar: avatarUri,
                likes_count: String(item.likesCount || 0),
                comments_count: String(item.commentsCount || 0),
                is_liked: item.isLiked ? "1" : "0",
                media_type: item.mediaType || "photo",
              },
            });
          }}
        >
          <PostMedia source={item.image} mediaType={item.mediaType} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>
        
        <FeedActivityIndicator postId={item.id} />
      </View>

      {/* Actions Row */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={item.isLiked ? colors.danger : colors.textPrimary}
            />
            <Text style={[styles.actionCount, { color: colors.textPrimary }, item.isLiked && styles.actionCountLiked]}>
              {item.likesCount >= 1000
                ? `${(item.likesCount / 1000).toFixed(1)}K`
                : item.likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => {
              const mediaUri = typeof item.image === "object" && item.image?.uri ? item.image.uri : undefined;
              const avatarUri = typeof item.author?.avatar === "object" && item.author?.avatar?.uri ? item.author.avatar.uri : undefined;
              router.push({
                pathname: "/post/[id]",
                params: {
                  id: item.id,
                  media_url: mediaUri,
                  caption: item.caption || "",
                  location: item.location || "",
                  author_username: item.author?.username || "",
                  author_fullName: item.author?.fullName || "",
                  author_avatar: avatarUri,
                  likes_count: String(item.likesCount || 0),
                  comments_count: String(item.commentsCount || 0),
                  is_liked: item.isLiked ? "1" : "0",
                },
              });
            }}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.actionCount, { color: colors.textPrimary }]}>{item.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleToggleSave(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={item.isSaved ? colors.primary : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Post Caption & Comments */}
      <View style={styles.captionContainer}>
        <Text style={[styles.captionText, { color: colors.textPrimary }]}>{item.caption}</Text>
        <TouchableOpacity
          style={styles.viewCommentsBtn}
          activeOpacity={0.7}
          onPress={() => {
            const mediaUri = typeof item.image === "object" && item.image?.uri ? item.image.uri : undefined;
            const avatarUri = typeof item.author?.avatar === "object" && item.author?.avatar?.uri ? item.author.avatar.uri : undefined;
            router.push({
              pathname: "/post/[id]",
              params: {
                id: item.id,
                media_url: mediaUri,
                caption: item.caption || "",
                location: item.location || "",
                author_username: item.author?.username || "",
                author_fullName: item.author?.fullName || "",
                author_avatar: avatarUri,
                likes_count: String(item.likesCount || 0),
                comments_count: String(item.commentsCount || 0),
                is_liked: item.isLiked ? "1" : "0",
              },
            });
          }}
        >
          <Text style={[styles.viewCommentsText, { color: colors.textMuted }]}>
            View all {item.commentsCount} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
// --- END: Extracted Memoized Post Component ---

const { width } = Dimensions.get("window");

interface Story {
  id: string;
  username: string;
  avatar: any;
  hasUnseenStory?: boolean;
  isUser?: boolean;
}

export interface PostItem {
  id: string;
  author: {
    username: string;
    avatar: any;
    location?: string;
    fullName?: string;
  };
  mediaType?: string;
  image: any;
  likesCount: number;
  commentsCount: number;
  caption: string;
  timeAgo: string;
  location?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export const FEED_POSTS: PostItem[] = [];

interface FeedScreenProps {
  onSignOut?: () => void;
}

const mapBackendPost = (bp: any, currentUser?: StoredUser | null): PostItem => {
  const isMine = currentUser && (currentUser.username === bp.author_username || currentUser.id === bp.author_id);
  const avatarUrl = isMine && currentUser?.avatar_url
    ? currentUser.avatar_url
    : (bp.author_avatar && typeof bp.author_avatar === "string" ? bp.author_avatar : undefined);
  const fullName = isMine && currentUser?.full_name
    ? currentUser.full_name
    : (bp.author_fullName || bp.author_username || "User");

  return {
    id: String(bp.id || bp._id),
    author: {
      username: bp.author_username || "user",
      fullName: fullName,
      avatar: resolveAvatarSource(avatarUrl || bp.author_avatar),
      location: bp.location,
    },
    location: bp.location,
    mediaType: bp.media_type || (bp.media_url?.toLowerCase().endsWith(".mp4") || bp.media_url?.toLowerCase().endsWith(".mov") ? "video" : "photo"),
    image: bp.media_url && typeof bp.media_url === "string"
      ? { uri: resolveFullUrl(bp.media_url) }
      : bp.media_urls?.[0] && typeof bp.media_urls[0] === "string"
      ? { uri: resolveFullUrl(bp.media_urls[0]) }
      : require("../../../assets/images/home_feed_bali_post.jpg"),
    likesCount: bp.likes_count || 0,
    commentsCount: bp.comments_count || 0,
    caption: bp.content || "",
    timeAgo: "2h",
    isLiked: !!bp.is_liked,
    isSaved: false,
  };
};

export function FeedScreen({ onSignOut }: FeedScreenProps = {}) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const { unreadCount } = useNotifications();
  const PAGE_SIZE = 15;
  const [bellIconRight, setBellIconRight] = useState<number | undefined>(undefined);
  const bellRef = useRef<View>(null);

  useEffect(() => {
    const handleUser = (u: StoredUser) => {
      setCurrentUser(u);
      setPosts((prev) => prev.map((p) => {
        if (p.author.username === u.username) {
          return {
            ...p,
            author: {
              ...p.author,
              avatar: resolveAvatarSource(u.avatar_url ? { uri: u.avatar_url } : p.author.avatar),
              fullName: u.full_name || p.author.fullName,
            }
          };
        }
        return p;
      }));
    };

    authStorage.getUser().then((u) => {
      if (u) handleUser(u);
    });

    const unsubscribe = userService.subscribe(handleUser);
    return () => unsubscribe();
  }, []);

  // Stories
  const stories: Story[] = [
    {
      id: "user",
      username: "Your story",
      avatar: resolveAvatarSource(currentUser?.avatar_url),
      isUser: true,
    },
    {
      id: "sarah",
      username: "sarah_k",
      avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
      hasUnseenStory: true,
    },
    {
      id: "travel",
      username: "travel.diary",
      avatar: { uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80" },
      hasUnseenStory: true,
    },
    {
      id: "alex",
      username: "alex_wanderer",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      hasUnseenStory: true,
    },
  ];

  useEffect(() => {
    // 1. Initial fetch from backend postService (paginated limit: 15, skip: 0)
    postService.getFeedPosts({ limit: PAGE_SIZE, skip: 0 }).then((backendPosts) => {
      if (backendPosts && backendPosts.length > 0) {
        setPosts(backendPosts.map((p) => mapBackendPost(p, currentUser)));
        setHasMore(backendPosts.length >= PAGE_SIZE);
      }
    });

    // 2. Convex-style live reactive sync subscription:
    const unsubscribeSync = syncClient.subscribe("posts:getFeed", { limit: PAGE_SIZE, skip: 0 }, (livePosts: any[]) => {
      if (Array.isArray(livePosts) && livePosts.length > 0) {
        setPosts((prev) => {
          const mapped = livePosts.map((p) => mapBackendPost(p, currentUser));
          if (prev.length <= PAGE_SIZE) {
            return mapped;
          }
          const liveIds = new Set(mapped.map((p) => p.id));
          const tail = prev.filter((p) => !liveIds.has(p.id));
          return [...mapped, ...tail];
        });
      }
    });

    // 3. Local postService notifications
    const unsubscribeLocal = postService.subscribe((newPost) => {
      const formatted = mapBackendPost(newPost, currentUser);
      setPosts((prev) => [formatted, ...prev.filter((p) => p.id !== formatted.id)]);
    });

    return () => {
      unsubscribeSync();
      unsubscribeLocal();
    };
  }, [currentUser]);

  const loadMoreFeedPosts = async () => {
    if (isLoadingRef.current || !hasMore || refreshing) return;
    isLoadingRef.current = true;
    setLoadingMore(true);
    try {
      const nextBatch = await postService.getFeedPosts({
        limit: PAGE_SIZE,
        skip: posts.length,
      });
      if (Array.isArray(nextBatch) && nextBatch.length > 0) {
        const mapped = nextBatch.map((p) => mapBackendPost(p, currentUser));
        setPosts((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = mapped.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setHasMore(nextBatch.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn("Failed to load more feed posts:", e);
    } finally {
      isLoadingRef.current = false;
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setHasMore(true);
    try {
      const fresh = await postService.getFeedPosts({ limit: PAGE_SIZE, skip: 0 });
      if (fresh && fresh.length > 0) {
        setPosts(fresh.map((p) => mapBackendPost(p, currentUser)));
        setHasMore(fresh.length >= PAGE_SIZE);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    // Optimistic local update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likesCount: nextLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      })
    );

    // Convex-like mutation auto-synced across cluster
    try {
      await syncClient.mutation("posts:like", { postId });
    } catch (e) {
      console.warn("Like mutation failed:", e);
    }
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, isSaved: !post.isSaved };
        }
        return post;
      })
    );
  };

  const renderStoriesHeader = () => (
    <View style={[styles.storiesContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScrollContent}
      >
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={() => {
              if (story.isUser || (currentUser?.username && currentUser.username === story.username)) {
                router.push("/(tabs)/profile");
              } else {
                router.push({
                  pathname: "/user-profile",
                  params: {
                    username: story.username,
                    name: story.username.replace("_", " ").replace(".", " ").toUpperCase(),
                  },
                });
              }
            }}
          >
            <View
              style={[
                styles.storyRing,
                { backgroundColor: colors.background, borderColor: colors.border },
                story.hasUnseenStory && styles.storyRingActive,
                story.isUser && { borderColor: colors.border },
              ]}
            >
              <Image source={story.avatar} style={styles.storyAvatar} />
              {story.isUser && (
                <View style={[styles.storyAddBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={[styles.storyUsername, { color: colors.textSecondary }]} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPost = React.useCallback(({ item }: { item: PostItem }) => (
    <PostCardItem 
      item={item} 
      currentUser={currentUser} 
      colors={colors} 
      handleToggleLike={handleToggleLike} 
      handleToggleSave={handleToggleSave} 
    />
  ), [currentUser, colors]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top App Header */}
      <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>WE</Text>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            onPress={() => router.push("/create-post")}
          >
            <Ionicons name="add-circle-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View
            ref={bellRef}
            collapsable={false}
            onLayout={() => {
              bellRef.current?.measureInWindow((x, y, w, h) => {
                // Calculate the center-x of the bell icon relative to the right side of the screen
                setBellIconRight(x + w / 2);
              });
            }}
          >
            <TouchableOpacity
              style={styles.topIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { borderColor: colors.background }]} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Global Activity Indicator - zero-height wrapper so it floats below header without affecting layout */}
      <View style={{ zIndex: 9999, elevation: 9999, height: 0 }}>
        <FeedActivityIndicator isGlobal={true} bellIconCenterX={bellIconRight} />
      </View>

      {/* Feed List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStoriesHeader}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMoreFeedPosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingMoreContainer: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  topIconBtn: {
    position: "relative",
    padding: 4,
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  storiesContainer: {
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  storiesScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: "center",
    width: 68,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  storyRingActive: {
    borderColor: Colors.primary,
  },
  storyRingUser: {
    borderColor: "#E2E8F0",
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyAddBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  storyUsername: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
    width: "100%",
  },
  listContent: {
    paddingBottom: 28,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorInfo: {
    justifyContent: "center",
  },
  nameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorUsername: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  timeDot: {
    marginHorizontal: 5,
    fontSize: 12,
    color: "#94A3B8",
  },
  postTime: {
    fontSize: 13,
    color: "#94A3B8",
  },
  locationText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  imageWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  postImage: {
    width: "100%",
    height: width * 0.85,
  },
  actionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionCountLiked: {
    color: "#EF4444",
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  captionText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: "#1E293B",
  },
  viewCommentsBtn: {
    marginTop: 6,
  },
  viewCommentsText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
