import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { EXPLORE_POSTS } from "../../screens/explore/ExploreScreen";
import { FEED_POSTS } from "../../screens/feed/FeedScreen";
import { postService, PostItemData } from "../../services/postService";
import { syncClient } from "../../services/reactiveSyncClient";
import { authStorage, StoredUser } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { PostMedia } from "../../components/common/PostMedia";
import { resolveAvatarSource, DEFAULT_AVATAR } from "../../utils/mediaHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CommentItem {
  id: string;
  author_username: string;
  author_avatar?: any;
  content: string;
  created_at?: string;
  likes?: number;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    media_url?: string;
    media_type?: string;
    caption?: string;
    location?: string;
    author_username?: string;
    author_fullName?: string;
    author_avatar?: string;
    likes_count?: string;
    comments_count?: string;
    is_liked?: string;
  }>();

  const postId = params.id;

  // 1. Initial State from navigation params or static lookup
  const initialPost = useMemo(() => {
    // If navigation passed media_url or caption params, use them directly
    if (params.media_url || params.caption || params.author_username) {
      return {
        id: postId,
        author_username: params.author_username || "",
        author_fullName: params.author_fullName || "",
        author_avatar: resolveAvatarSource(params.author_avatar),
        media_url: params.media_url,
        media_type: params.media_type || (params.media_url?.toLowerCase().endsWith(".mp4") || params.media_url?.toLowerCase().endsWith(".mov") ? "video" : "photo"),
        caption: params.caption || "",
        location: params.location || "",
        likes_count: parseInt(params.likes_count || "0", 10),
        comments_count: parseInt(params.comments_count || "0", 10),
        is_liked: params.is_liked === "1",
        timeAgo: "Just now",
      };
    }

    // Lookup in explore or feed static list if exists
    const foundExplore = EXPLORE_POSTS.find((p) => p.id === postId);
    if (foundExplore) {
      return {
        id: postId,
        author_username: foundExplore.author.username,
        author_fullName: foundExplore.author.fullName || foundExplore.author.username,
        author_avatar: foundExplore.author.avatar,
        media_url: typeof foundExplore.image === "object" && (foundExplore.image as any)?.uri
          ? (foundExplore.image as any).uri
          : undefined,
        media_type: (foundExplore as any).type || "photo",
        fallbackImage: foundExplore.image,
        caption: foundExplore.caption,
        location: "",
        likes_count: foundExplore.likes,
        comments_count: foundExplore.comments,
        is_liked: false,
        timeAgo: foundExplore.timeAgo || "1h ago",
      };
    }

    const foundFeed = FEED_POSTS.find((p) => p.id === postId);
    if (foundFeed) {
      return {
        id: postId,
        author_username: foundFeed.author.username,
        author_fullName: foundFeed.author.fullName || foundFeed.author.username,
        author_avatar: foundFeed.author.avatar,
        media_url: typeof foundFeed.image === "object" && (foundFeed.image as any)?.uri
          ? (foundFeed.image as any).uri
          : undefined,
        media_type: (foundFeed as any).mediaType || "photo",
        fallbackImage: foundFeed.image,
        caption: foundFeed.caption,
        location: foundFeed.location || "",
        likes_count: foundFeed.likesCount,
        comments_count: foundFeed.commentsCount,
        is_liked: foundFeed.isLiked || false,
        timeAgo: "2h ago",
      };
    }

    // Default minimal loading state
    return {
      id: postId,
      author_username: "user",
      author_fullName: "User",
      author_avatar: DEFAULT_AVATAR,
      media_url: undefined,
      media_type: "photo",
      fallbackImage: undefined,
      caption: "",
      location: "",
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      timeAgo: "Just now",
    };
  }, [postId, params]);

  const [post, setPost] = useState(initialPost);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(initialPost.is_liked));
  const [likesCount, setLikesCount] = useState<number>(initialPost.likes_count || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isZooming, setIsZooming] = useState(false);

  // 2. Fetch logged in user and subscribe to changes
  useEffect(() => {
    const handleUser = (u: StoredUser) => {
      setCurrentUser(u);
      setPost((prev) => {
        if (prev.author_username === u.username) {
          return {
            ...prev,
            author_avatar: resolveAvatarSource(u.avatar_url || prev.author_avatar),
            author_fullName: u.full_name || prev.author_fullName || u.username,
          };
        }
        return prev;
      });
    };

    authStorage.getUser().then((u) => {
      if (u) {
        handleUser(u);
      }
    });

    const unsubscribe = userService.subscribe((u) => {
      handleUser(u);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Convex-like Reactive Sync Subscription for Post Details & Comments
  useEffect(() => {
    if (!postId) return;

    // Load initial post from backend
    postService.getPostById(postId).then((livePost) => {
      if (livePost) {
        updateFromLivePost(livePost);
      }
    });

    // Convex-style live reactive sync for the post
    const unsubPost = syncClient.subscribe("posts:getPost", { postId }, (livePost: any) => {
      if (livePost) {
        updateFromLivePost(livePost);
      }
    });

    // Load and subscribe to live comments
    postService.getComments(postId).then((comments) => {
      if (Array.isArray(comments)) {
        setCommentsList(mapComments(comments));
      }
      setLoadingComments(false);
    });

    const unsubComments = syncClient.subscribe("posts:getComments", { postId }, (liveComments: any[]) => {
      if (Array.isArray(liveComments)) {
        setCommentsList(mapComments(liveComments));
      }
      setLoadingComments(false);
    });

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [postId, currentUser]);

  const updateFromLivePost = (livePost: any) => {
    const isMine = currentUser && (currentUser.username === livePost.author_username || currentUser.id === livePost.author_id);
    setPost((prev) => {
      const authorAvatar = (isMine && currentUser?.avatar_url) ? currentUser.avatar_url : livePost.author_avatar;
      const resolvedAvatar = resolveAvatarSource(authorAvatar || prev.author_avatar);
      const resolvedFullName = isMine && currentUser?.full_name ? currentUser.full_name : (livePost.author_fullName || prev.author_fullName);

      return {
        ...prev,
        author_username: livePost.author_username || prev.author_username,
        author_fullName: resolvedFullName,
        author_avatar: resolvedAvatar,
        media_url: livePost.media_url || livePost.media_urls?.[0] || prev.media_url,
        media_type: livePost.media_type || prev.media_type,
        caption: livePost.content || livePost.caption || prev.caption,
        location: livePost.location || prev.location,
        likes_count: livePost.likes_count ?? prev.likes_count,
        comments_count: livePost.comments_count ?? prev.comments_count,
        is_liked: livePost.is_liked ?? prev.is_liked,
      };
    });
    if (typeof livePost.is_liked === "boolean") {
      setIsLiked(livePost.is_liked);
    }
    if (typeof livePost.likes_count === "number") {
      setLikesCount(livePost.likes_count);
    }
  };

  const mapComments = (raw: any[]): CommentItem[] => {
    return raw.map((c) => {
      const isMine = currentUser && (currentUser.username === c.author_username || currentUser.id === c.author_id);
      const rawAvatar = isMine && currentUser?.avatar_url
        ? currentUser.avatar_url
        : (c.author_avatar || c.avatar);
      return {
        id: String(c.id || c._id || `c_${Math.random()}`),
        author_username: c.author_username || c.username || "user",
        author_avatar: resolveAvatarSource(rawAvatar),
        content: c.content || c.text || "",
        created_at: c.created_at ? formatTimeAgo(c.created_at) : "Just now",
        likes: c.likes || 0,
      };
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  // 4. Like Post Handler
  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await postService.toggleLike(postId);
      if (res && typeof res.isLiked === "boolean") {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch (e) {
      console.log("Failed to toggle like:", e);
    }
  };

  // 5. Add Comment Handler
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");

    const myAvatar = resolveAvatarSource(currentUser?.avatar_url);

    const newCommentItem: CommentItem = {
      id: `cm_${Date.now()}`,
      author_username: currentUser?.username || "user",
      author_avatar: myAvatar,
      content: text,
      created_at: "Just now",
      likes: 0,
    };

    setCommentsList((prev) => [newCommentItem, ...prev]);
    setPost((prev) => ({ ...prev, comments_count: prev.comments_count + 1 }));

    try {
      await postService.addComment(postId, text);
    } catch (e) {
      console.log("Failed to add comment:", e);
    }
  };

  const isMyPost = Boolean(
    currentUser?.username && currentUser.username === post.author_username
  );

  useEffect(() => {
    if (post.author_username && !isMyPost) {
      userService.getFollowStatus(post.author_username).then((res) => {
        setIsFollowing(res.isFollowing);
      });
    }
  }, [post.author_username, isMyPost]);

  const handleToggleFollow = async () => {
    if (!post.author_username || isMyPost) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    if (nextFollowing) {
      toast.success(`Following @${post.author_username}`);
    } else {
      toast.info(`Unfollowed @${post.author_username}`);
    }

    try {
      const res = await userService.toggleFollow(post.author_username);
      setIsFollowing(res.isFollowing);
    } catch (e) {
      console.log("Toggle follow error in post detail:", e);
    }
  };

  const handleAuthorPress = () => {
    if (isMyPost) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/user-profile",
        params: {
          username: post.author_username,
          name: post.author_fullName,
        },
      });
    }
  };

  // Resolve media source
  const mediaSource = useMemo(() => {
    if (post.media_url) {
      return { uri: post.media_url };
    }
    if ((post as any).fallbackImage) {
      return (post as any).fallbackImage;
    }
    return require("../../../assets/images/home_feed_bali_post.jpg");
  }, [post.media_url, (post as any).fallbackImage]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Instagram-style backdrop overlay during pinch-to-zoom */}
      {isZooming && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: 9990,
            },
          ]}
        />
      )}

      {/* 1. Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }, isZooming && { opacity: 0.15 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText weight="bold" style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {post.location ? post.location.toUpperCase() : "POST"}
          </AppText>
          <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Post</AppText>
        </View>

        <TouchableOpacity style={styles.headerRightBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isZooming}
        style={{ zIndex: isZooming ? 9999 : 1 }}
      >
        {/* 2. Post Author Row */}
        <View style={[styles.authorRow, isZooming && { opacity: 0.15 }]}>
          <TouchableOpacity
            style={styles.authorLeft}
            activeOpacity={0.8}
            onPress={handleAuthorPress}
          >
            <Image source={resolveAvatarSource(post.author_avatar)} style={styles.authorAvatar} />
            <View>
              <AppText weight="bold" style={[styles.authorUsername, { color: colors.textPrimary }]}>{post.author_username}</AppText>
              {post.location ? (
                <AppText style={[styles.authorFullName, { color: colors.textSecondary }]}>{post.location}</AppText>
              ) : (
                <AppText style={[styles.authorFullName, { color: colors.textSecondary }]}>{post.author_fullName}</AppText>
              )}
            </View>
          </TouchableOpacity>

          {isMyPost ? (
            <TouchableOpacity
              style={[styles.myPostBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/profile")}
              accessibilityRole="button"
            >
              <AppText weight="semiBold" style={[styles.myPostBadgeText, { color: colors.textSecondary }]}>Your Post</AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && { backgroundColor: colors.surface }]}
              onPress={handleToggleFollow}
              accessibilityRole="button"
            >
              <AppText weight="semiBold" style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
                {isFollowing ? "Following" : "Follow"}
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Media Image / Video (Edge-to-Edge) */}
        <View style={[styles.mediaContainer, isZooming && { zIndex: 9999, elevation: 9999 }]}>
          <PostMedia
            source={mediaSource}
            mediaType={post.media_type || (params as any).media_type}
            style={styles.mediaImage}
            resizeMode="cover"
            isDetailScreen
            enableZoom={true}
            onZoomChange={setIsZooming}
            onDoubleTapLike={handleToggleLike}
          />
        </View>

        {/* 4. Action Buttons Bar (Like, Comment, Share, Save) */}
        <View style={[styles.actionsBar, isZooming && { opacity: 0.15 }]}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleToggleLike}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={27}
                color={isLiked ? colors.danger : colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/messages")}
            >
              <Ionicons name="paper-plane-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setIsSaved((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={25}
              color={isSaved ? colors.primary : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* 5. Likes Count */}
        <View style={[styles.detailsSection, isZooming && { opacity: 0.15 }]}>
          <AppText weight="bold" style={[styles.likesText, { color: colors.textPrimary }]}>
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </AppText>

          {/* Caption */}
          {post.caption ? (
            <AppText style={[styles.captionText, { color: colors.textPrimary }]}>
              <AppText
                weight="bold"
                style={[styles.captionAuthor, { color: colors.textPrimary }]}
                onPress={handleAuthorPress}
              >
                {post.author_username}{" "}
              </AppText>
              {post.caption}
            </AppText>
          ) : null}

          <AppText style={[styles.timeAgo, { color: colors.textMuted }]}>{post.timeAgo}</AppText>
        </View>

        {/* 6. Comments Section */}
        <View style={[styles.commentsSection, { borderTopColor: colors.border }, isZooming && { opacity: 0.15 }]}>
          <AppText weight="bold" style={[styles.commentsHeading, { color: colors.textPrimary }]}>
            Comments ({commentsList.length})
          </AppText>

          {loadingComments ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : commentsList.length === 0 ? (
            <View style={styles.emptyCommentsWrap}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.borderLight} />
              <AppText style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                No comments yet. Start the conversation!
              </AppText>
            </View>
          ) : (
            commentsList.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Image source={resolveAvatarSource(c.author_avatar)} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <AppText style={[styles.commentBody, { color: colors.textPrimary }]}>
                    <AppText weight="bold" style={[styles.commentAuthor, { color: colors.textPrimary }]}>{c.author_username} </AppText>
                    {c.content}
                  </AppText>
                  <View style={styles.commentMeta}>
                    <AppText style={[styles.commentTime, { color: colors.textMuted }]}>{c.created_at}</AppText>
                    <TouchableOpacity>
                      <AppText weight="medium" style={[styles.commentReply, { color: colors.textSecondary }]}>Reply</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.commentLikeBtn}>
                  <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 7. Bottom Add Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.addCommentBar, { backgroundColor: colors.background, borderTopColor: colors.border }, isZooming && { opacity: 0.15 }]}>
          <Image
            source={resolveAvatarSource(currentUser?.avatar_url)}
            style={styles.myCommentAvatar}
          />
          <TextInput
            style={[styles.commentInput, { color: colors.textPrimary }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleAddComment}
            returnKeyType="send"
          />
          {commentText.trim().length > 0 && (
            <TouchableOpacity onPress={handleAddComment} style={styles.postCommentBtn} accessibilityRole="button">
              <AppText weight="bold" style={[styles.postCommentBtnText, { color: colors.primary }]}>Post</AppText>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerSubtitle: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: "#94A3B8",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: "#0F172A",
  },
  headerRightBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  authorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  authorUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
  },
  authorFullName: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#64748B",
  },
  followBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followingBtn: {
    backgroundColor: "#E2E8F0",
  },
  followBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  followingBtnText: {
    color: "#0F172A",
  },
  myPostBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  myPostBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: "#64748B",
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#000000",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  detailsSection: {
    paddingHorizontal: 14,
    gap: 5,
  },
  likesText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
  },
  captionText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 20,
  },
  captionAuthor: {
    fontFamily: FontFamily.bold,
    color: "#0F172A",
  },
  timeAgo: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  commentsSection: {
    marginTop: 18,
    paddingHorizontal: 14,
    borderTopWidth: 0.5,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
    gap: 14,
  },
  commentsHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 4,
  },
  emptyCommentsWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 6,
  },
  emptyCommentsText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#94A3B8",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
    gap: 4,
  },
  commentBody: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 18,
  },
  commentAuthor: {
    fontFamily: FontFamily.bold,
  },
  commentMeta: {
    flexDirection: "row",
    gap: 12,
  },
  commentTime: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: "#8E8E93",
  },
  commentReply: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: "#64748B",
  },
  commentLikeBtn: {
    padding: 4,
  },
  addCommentBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  myCommentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  commentInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 4,
  },
  postCommentBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postCommentBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.primary,
  },
});
