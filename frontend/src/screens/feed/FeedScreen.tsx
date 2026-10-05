import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";

import { ExplorePost } from "../explore/ExploreScreen";

const { width } = Dimensions.get("window");

interface Story {
  id: string;
  username: string;
  avatar: any;
  hasUnseenStory?: boolean;
  isUser?: boolean;
}

interface PostItem {
  id: string;
  author: {
    username: string;
    avatar: any;
    location?: string;
  };
  image: any;
  likesCount: number;
  commentsCount: number;
  caption: string;
  timeAgo: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

// Export feed posts matching ExplorePost shape so post/[id] can display them seamlessly
export const FEED_POSTS: ExplorePost[] = [
  {
    id: "f1",
    type: "photo",
    category: "Travel",
    author: {
      username: "alex_wanderer",
      fullName: "Alex Rivera",
      avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
      isMe: false,
    },
    image: require("../../../assets/images/home_feed_bali_post.jpg"),
    likes: 2400,
    comments: 189,
    caption: "Grateful for moments like this 🌅\nLife is better outside.",
    timeAgo: "2h ago",
  },
  {
    id: "f2",
    type: "photo",
    category: "Travel",
    author: {
      username: "sarah_k",
      fullName: "Sarah Jenkins",
      avatar: require("../../../assets/images/onboarding_slide_3.jpg"),
      isMe: false,
    },
    image: require("../../../assets/images/cinque_terre_post.jpg"),
    likes: 1820,
    comments: 87,
    caption: "Some places just feel like home 💙",
    timeAgo: "4h ago",
  },
  {
    id: "f3",
    type: "photo",
    category: "Nature",
    author: {
      username: "travel.diary",
      fullName: "Sophie Dupont",
      avatar: require("../../../assets/images/onboarding_slide_2.jpg"),
      isMe: false,
    },
    image: require("../../../assets/images/splash_mountain.jpg"),
    likes: 3150,
    comments: 240,
    caption: "Just returned from an amazing week in Iceland! The landscapes are unreal. 🇮🇸🏔️",
    timeAgo: "6h ago",
  },
];

const INITIAL_POST_ITEMS: PostItem[] = [
  {
    id: "f1",
    author: {
      username: "alex_wanderer",
      avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
      location: "Bali, Indonesia",
    },
    image: require("../../../assets/images/home_feed_bali_post.jpg"),
    likesCount: 2400,
    commentsCount: 189,
    caption: "Grateful for moments like this 🌅\nLife is better outside.",
    timeAgo: "2h",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "f2",
    author: {
      username: "sarah_k",
      avatar: require("../../../assets/images/onboarding_slide_3.jpg"),
      location: "Cinque Terre, Italy",
    },
    image: require("../../../assets/images/cinque_terre_post.jpg"),
    likesCount: 1820,
    commentsCount: 87,
    caption: "Some places just feel like home 💙",
    timeAgo: "4h",
    isLiked: true,
    isSaved: false,
  },
  {
    id: "f3",
    author: {
      username: "travel.diary",
      avatar: require("../../../assets/images/onboarding_slide_2.jpg"),
      location: "Reykjavik, Iceland",
    },
    image: require("../../../assets/images/splash_mountain.jpg"),
    likesCount: 3150,
    commentsCount: 240,
    caption: "Just returned from an amazing week in Iceland! The landscapes are unreal. 🇮🇸🏔️",
    timeAgo: "6h",
    isLiked: false,
    isSaved: true,
  },
];

interface FeedScreenProps {
  onSignOut?: () => void;
}

export function FeedScreen({ onSignOut }: FeedScreenProps = {}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POST_ITEMS);

  // Stories matching Screen 04
  const stories: Story[] = [
    {
      id: "user",
      username: "Your story",
      avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
      isUser: true,
    },
    {
      id: "sarah",
      username: "sarah_k",
      avatar: require("../../../assets/images/onboarding_slide_3.jpg"),
      hasUnseenStory: true,
    },
    {
      id: "travel",
      username: "travel.diary",
      avatar: require("../../../assets/images/onboarding_slide_2.jpg"),
      hasUnseenStory: true,
    },
    {
      id: "fitness",
      username: "fitnesslife",
      avatar: require("../../../assets/images/onboarding_hero.jpg"),
      hasUnseenStory: true,
    },
    {
      id: "foodie",
      username: "foodie_joy",
      avatar: require("../../../assets/images/onboarding_slide_4.jpg"),
      hasUnseenStory: true,
    },
    {
      id: "alex",
      username: "alex_wanderer",
      avatar: require("../../../assets/images/profile_gokul_avatar.jpg"),
      hasUnseenStory: true,
    },
  ];

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likesCount: nextLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      })
    );
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const renderStoriesHeader = () => (
    <View style={styles.storiesContainer}>
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
              if (story.isUser) {
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
                story.hasUnseenStory && styles.storyRingActive,
                story.isUser && styles.storyRingUser,
              ]}
            >
              <Image source={story.avatar} style={styles.storyAvatar} />
              {story.isUser && (
                <View style={styles.storyAddBadge}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPost = ({ item }: { item: PostItem }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/user-profile",
              params: {
                username: item.author.username,
                name: item.author.username.replace("_", " ").replace(".", " ").toUpperCase(),
                location: item.author.location || "",
              },
            })
          }
        >
          <Image source={item.author.avatar} style={styles.authorAvatar} />
          <View style={styles.authorInfo}>
            <View style={styles.nameTimeRow}>
              <Text style={styles.authorUsername}>{item.author.username}</Text>
              <Text style={styles.timeDot}>•</Text>
              <Text style={styles.postTime}>{item.timeAgo}</Text>
            </View>
            {item.author.location ? (
              <Text style={styles.locationText}>{item.author.location}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Post Image with Rounded Corners */}
      <TouchableOpacity
        style={styles.imageWrapper}
        activeOpacity={0.94}
        onPress={() =>
          router.push({
            pathname: "/post/[id]",
            params: { id: item.id },
          })
        }
      >
        <Image source={item.image} style={styles.postImage} resizeMode="cover" />
      </TouchableOpacity>

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
              color={item.isLiked ? "#EF4444" : "#0F172A"}
            />
            <Text style={[styles.actionCount, item.isLiked && styles.actionCountLiked]}>
              {item.likesCount >= 1000
                ? `${(item.likesCount / 1000).toFixed(1)}K`
                : item.likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: "/post/[id]",
                params: { id: item.id },
              })
            }
          >
            <Ionicons name="chatbubble-outline" size={22} color="#0F172A" />
            <Text style={styles.actionCount}>{item.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleToggleSave(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={item.isSaved ? Colors.primary : "#0F172A"}
          />
        </TouchableOpacity>
      </View>

      {/* Post Caption & Comments */}
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>{item.caption}</Text>
        <TouchableOpacity
          style={styles.viewCommentsBtn}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/post/[id]",
              params: { id: item.id },
            })
          }
        >
          <Text style={styles.viewCommentsText}>
            View all {item.commentsCount} comments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Header */}
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>WE</Text>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStoriesHeader}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
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
