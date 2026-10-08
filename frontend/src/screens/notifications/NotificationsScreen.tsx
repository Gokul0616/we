import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { authStorage, StoredUser } from "../../services/authStorage";
import { useNotifications, NotificationItem } from "../../context/NotificationContext";
import { resolveAvatarSource, resolveFullUrl } from "../../utils/mediaHelper";

// Local image references
const IMG_SANTORINI = require("../../../assets/images/explore_santorini.jpg");
const IMG_FOOD = require("../../../assets/images/explore_food.jpg");
const IMG_CINQUE = require("../../../assets/images/cinque_terre_post.jpg");
const IMG_BALI = require("../../../assets/images/home_feed_bali_post.jpg");

const strId = (n: any) => String(n.id || n._id || n);

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return "just now";
  let isoStr = dateStr;
  if (!isoStr.endsWith("Z") && !isoStr.includes("+")) {
    isoStr = isoStr.replace(" ", "T") + "Z";
  }
  const date = new Date(isoStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w`;
};

export function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState<"All" | "Follows" | "Likes" | "Comments">("All");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { notifications, followRequests, unreadCount, markAllAsRead, clearAllNotifications, refreshNotifications } = useNotifications();

  React.useEffect(() => {
    let isCancelled = false;
    authStorage.getUser().then(u => {
      if (!isCancelled) setCurrentUser(u);
    });

    // Mark all as read when screen mounts
    if (unreadCount > 0) {
      markAllAsRead();
    }

    return () => {
      isCancelled = true;
    };
  }, [unreadCount, markAllAsRead]);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    refreshNotifications();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [refreshNotifications]);

  const toggleFollow = async (id: string, targetUsername: string) => {
    const nextFollowing = !followingMap[id];
    setFollowingMap((prev) => ({
      ...prev,
      [id]: nextFollowing,
    }));
    if (nextFollowing) {
      toast.success(`Following @${targetUsername}`);
    } else {
      toast.info(`Unfollowed @${targetUsername}`);
    }

    try {
      const res = await userService.toggleFollow(targetUsername);
      setFollowingMap((prev) => ({
        ...prev,
        [id]: res.isFollowing,
      }));
    } catch (e) {
      console.warn("Toggle follow error in notifications:", e);
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (item.type === "FOLLOW" || item.type === "FOLLOW_ACCEPTED") {
      if (currentUser?.username === item.actor_username) {
        router.push("/(tabs)/profile");
      } else {
        router.push({ pathname: "/user-profile", params: { username: item.actor_username } });
      }
    } else if (item.type === "FOLLOW_REQUEST") {
      router.push("/follow-requests");
    } else if (["LIKE", "COMMENT", "REPLY", "MENTION", "REPOST"].includes(item.type)) {
      if (item.post_id) {
        router.push({ pathname: "/post/[id]", params: { id: item.post_id } });
      }
    }
  };

  // Helper to map DB notifications to UI format
  const mappedNotifications = React.useMemo(() => {
    const items = notifications.map(n => {
      let type: "like" | "comment" | "follow" | "mention" | "follow_request" = "like";
      let actionText = "interacted with you";
      
      switch (n.type) {
        case "FOLLOW": type = "follow"; actionText = "started following you."; break;
        case "FOLLOW_REQUEST": type = "follow_request"; actionText = "requested to follow you."; break;
        case "FOLLOW_ACCEPTED": type = "follow"; actionText = "accepted your follow request."; break;
        case "LIKE": type = "like"; actionText = "liked your post."; break;
        case "COMMENT": type = "comment"; actionText = "commented on your post."; break;
        case "REPLY": type = "comment"; actionText = "replied to your comment."; break;
        case "MENTION": type = "mention"; actionText = "mentioned you."; break;
        case "REPOST": type = "like"; actionText = "reposted your post."; break;
        case "SYSTEM": type = "mention"; actionText = n.message || "sent a system notification."; break;
      }

      return {
        id: n.id,
        raw: n,
        type,
        user: {
          username: n.actor_username || "system",
          avatar: n.actor_avatar ? resolveAvatarSource(n.actor_avatar) : require("../../../assets/images/default_avatar.png")
        },
        text: actionText,
        timeAgo: formatTimeAgo(n.created_at),
        isFollowing: false, // Could be fetched or synced from local state
        postImage: ["LIKE", "COMMENT", "REPLY", "MENTION", "REPOST"].includes(n.type) ? IMG_BALI : undefined, // Replace with actual post thumbnail if available
      };
    });

    if (items.length === 0) {
      return []; // Return empty array to render empty state
    }

    return [
      {
        title: "Recent",
        items: items
      }
    ];
  }, [notifications]);

  const filteredSections = mappedNotifications.map((section) => {
    if (activeFilter === "All") return section;
    const filteredItems = section.items.filter((item) => {
      if (activeFilter === "Follows") return item.type === "follow";
      if (activeFilter === "Likes") return item.type === "like";
      if (activeFilter === "Comments") return item.type === "comment" || item.type === "mention";
      return true;
    });
    return { ...section, items: filteredItems };
  }).filter((section) => section.items.length > 0);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* 1. Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={clearAllNotifications}>
          <Text style={{ fontFamily: FontFamily.semiBold, fontSize: 14, color: Colors.primary }}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Filter Pills Row */}
      <View style={[styles.filterRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(["All", "Follows", "Likes", "Comments"] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                { backgroundColor: colors.surface },
                isActive && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: colors.textSecondary },
                  isActive && styles.filterPillTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* 3. Follow Requests Banner (Instagram Style) */}
        {followRequests.length > 0 && (
          <TouchableOpacity 
            style={[styles.requestsBanner, { borderBottomColor: colors.border }]} 
            activeOpacity={0.7}
            onPress={() => router.push("/follow-requests")}
          >
            <View style={styles.requestsLeft}>
              <View style={[styles.requestsBadgeCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="person-add" size={18} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={[styles.requestsTitle, { color: colors.textPrimary }]}>Follow requests</Text>
                <Text style={[styles.requestsSubtitle, { color: colors.textSecondary }]}>Approve or ignore requests</Text>
              </View>
            </View>
            <View style={styles.requestsRight}>
              <View style={[styles.requestsCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.requestsCountText}>{followRequests.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* 4. Time-Grouped Notification List OR Empty State */}
        {filteredSections.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: FontFamily.bold, fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>No notifications</Text>
            <Text style={{ fontFamily: FontFamily.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              When people like, comment, or interact with you, you'll see it here.
            </Text>
          </View>
        ) : (
          filteredSections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>

              {section.items.map((item) => {
                const isFollowing = !!followingMap[item.id];
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.notificationRow, 
                      item.raw && !item.raw.read && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
                    ]}
                    onPress={() => item.raw && handleNotificationPress(item.raw)}
                    activeOpacity={0.7}
                  >
                    {/* User Avatar */}
                    <TouchableOpacity
                      onPress={() => {
                        if (currentUser?.username && currentUser.username === item.user.username) {
                          router.push("/(tabs)/profile");
                        } else {
                          router.push({
                            pathname: "/user-profile",
                            params: { username: item.user.username },
                          });
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={item.user.avatar} style={styles.userAvatar} />
                    </TouchableOpacity>

                    {/* Notification Description */}
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationText, { color: colors.textPrimary }]}>
                        <Text style={[styles.notificationUsername, { color: colors.textPrimary }]}>
                          {item.user.username}{" "}
                        </Text>
                        {item.text}{" "}
                        <Text style={[styles.notificationTime, { color: colors.textMuted }]}>{item.timeAgo}</Text>
                      </Text>
                    </View>

                    {/* Right Trailing Action: Follow/Following Button OR Post Thumbnail */}
                    {item.type === "follow" || item.type === "follow_request" ? (
                      <TouchableOpacity
                        onPress={() => toggleFollow(item.id, item.user.username)}
                        style={[
                          styles.followBtn,
                          { backgroundColor: colors.primary },
                          isFollowing && { backgroundColor: colors.surface },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.followBtnText,
                            isFollowing && { color: colors.textPrimary },
                          ]}
                        >
                          {isFollowing ? "Following" : "Follow Back"}
                        </Text>
                      </TouchableOpacity>
                    ) : item.postImage ? (
                      <TouchableOpacity activeOpacity={0.8} onPress={() => item.raw && handleNotificationPress(item.raw)}>
                        <Image
                          source={item.postImage}
                          style={styles.postThumbnail}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : null}
                    
                    {item.raw && !item.raw.read && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  requestsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    marginBottom: 6,
  },
  requestsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestsBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  requestsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: "#0F172A",
  },
  requestsSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  requestsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestsCountBadge: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  requestsCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: "#FFFFFF",
  },
  sectionContainer: {
    marginTop: 14,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 10,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },
  notificationContent: {
    flex: 1,
    paddingRight: 10,
  },
  notificationText: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
    color: "#0F172A",
    lineHeight: 18,
  },
  notificationUsername: {
    fontFamily: FontFamily.bold,
  },
  notificationTime: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#8E8E93",
  },
  followBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 92,
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: "#EFEFEF",
  },
  followBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: "#FFFFFF",
  },
  followingBtnText: {
    color: "#0F172A",
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
});
