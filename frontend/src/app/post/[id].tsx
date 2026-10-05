import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";
import { EXPLORE_POSTS, ExplorePost } from "../../screens/explore/ExploreScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find post from explore posts or fallback
  const post = useMemo<ExplorePost>(() => {
    const found = EXPLORE_POSTS.find((p) => p.id === id);
    if (found) return found;
    return (
      EXPLORE_POSTS[0] || {
        id: "p1",
        type: "photo",
        image: require("../../../assets/images/cinque_terre_post.jpg"),
        author: {
          username: "user",
          fullName: "User",
          avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
        },
        caption: "Exploring wonderful spaces!",
        likes: 120,
        comments: 12,
        timeAgo: "1h ago",
      }
    );
  }, [id]);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState([
    {
      id: "c1",
      username: "sarah.j",
      avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
      text: "This shot is absolutely breathtaking! 😍✨",
      timeAgo: "45m",
      likes: 14,
    },
    {
      id: "c2",
      username: "alex_wanderer",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      text: "The lighting here is perfection. Which camera did you use?",
      timeAgo: "22m",
      likes: 5,
    },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setCommentsList((prev) => [
      ...prev,
      {
        id: `cm_${Date.now()}`,
        username: "gokul7",
        avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
        text: commentText.trim(),
        timeAgo: "Just now",
        likes: 0,
      },
    ]);
    setCommentText("");
  };

  const likesDisplay = (post.likes + (isLiked ? 1 : 0)).toLocaleString();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSubtitle}>EXPLORE</Text>
          <Text style={styles.headerTitle}>Post</Text>
        </View>

        <TouchableOpacity style={styles.headerRightBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Post Author Row */}
        <View style={styles.authorRow}>
          <TouchableOpacity
            style={styles.authorLeft}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Image source={post.author.avatar} style={styles.authorAvatar} />
            <View>
              <Text style={styles.authorUsername}>{post.author.username}</Text>
              <Text style={styles.authorFullName}>{post.author.fullName}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => setIsFollowing((prev) => !prev)}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Media Image (Edge-to-Edge) */}
        <View style={styles.mediaContainer}>
          <Image
            source={post.image}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>

        {/* 4. Action Buttons Bar (Like, Comment, Share, Save) */}
        <View style={styles.actionsBar}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setIsLiked((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={27}
                color={isLiked ? "#ED4956" : "#0F172A"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={24} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/messages")}
            >
              <Ionicons name="paper-plane-outline" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setIsSaved((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={25}
              color="#0F172A"
            />
          </TouchableOpacity>
        </View>

        {/* 5. Likes Count */}
        <View style={styles.detailsSection}>
          <Text style={styles.likesText}>{likesDisplay} likes</Text>

          {/* Caption */}
          <Text style={styles.captionText}>
            <Text
              style={styles.captionAuthor}
              onPress={() => router.push("/(tabs)/profile")}
            >
              {post.author.username}{" "}
            </Text>
            {post.caption}
          </Text>

          <Text style={styles.timeAgo}>{post.timeAgo}</Text>
        </View>

        {/* 6. Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeading}>Comments ({commentsList.length})</Text>

          {commentsList.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Image source={c.avatar} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{c.username} </Text>
                  {c.text}
                </Text>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentTime}>{c.timeAgo}</Text>
                  <TouchableOpacity>
                    <Text style={styles.commentReply}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.commentLikeBtn}>
                <Ionicons name="heart-outline" size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 7. Bottom Add Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.addCommentBar}>
          <Image
            source={require("../../../assets/images/profile_gokul_avatar.jpg")}
            style={styles.myCommentAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#8E8E93"
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleAddComment}
            returnKeyType="send"
          />
          {commentText.trim().length > 0 && (
            <TouchableOpacity onPress={handleAddComment} style={styles.postCommentBtn}>
              <Text style={styles.postCommentBtnText}>Post</Text>
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
