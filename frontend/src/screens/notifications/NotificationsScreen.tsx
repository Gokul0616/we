import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";

// Local image references
const IMG_SANTORINI = require("../../../assets/images/explore_santorini.jpg");
const IMG_FOOD = require("../../../assets/images/explore_food.jpg");
const IMG_CINQUE = require("../../../assets/images/cinque_terre_post.jpg");
const IMG_BALI = require("../../../assets/images/home_feed_bali_post.jpg");

interface NotificationItem {
  id: string;
  type: "like" | "comment" | "follow" | "mention";
  user: {
    username: string;
    avatar: any;
  };
  text: string;
  timeAgo: string;
  postImage?: any;
  isFollowing?: boolean;
}

interface NotificationSection {
  title: string;
  items: NotificationItem[];
}

const NOTIFICATIONS_SECTIONS: NotificationSection[] = [
  {
    title: "New",
    items: [
      {
        id: "n1",
        type: "follow",
        user: {
          username: "sarah.j",
          avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
        },
        text: "started following you.",
        timeAgo: "15m",
        isFollowing: false,
      },
      {
        id: "n2",
        type: "like",
        user: {
          username: "alex.c",
          avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
        },
        text: "liked your photo.",
        timeAgo: "45m",
        postImage: IMG_SANTORINI,
      },
    ],
  },
  {
    title: "Today",
    items: [
      {
        id: "n3",
        type: "comment",
        user: {
          username: "elena_travels",
          avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
        },
        text: 'commented: "This view is completely breathtaking! 😍"',
        timeAgo: "3h",
        postImage: IMG_CINQUE,
      },
      {
        id: "n4",
        type: "like",
        user: {
          username: "priya.s",
          avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
        },
        text: "and 14 others liked your post.",
        timeAgo: "5h",
        postImage: IMG_FOOD,
      },
      {
        id: "n5",
        type: "follow",
        user: {
          username: "daniel.k",
          avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
        },
        text: "started following you.",
        timeAgo: "7h",
        isFollowing: true,
      },
    ],
  },
  {
    title: "This Week",
    items: [
      {
        id: "n6",
        type: "mention",
        user: {
          username: "bali_vibes",
          avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
        },
        text: 'mentioned you in a comment: "@gokul you have to visit this spot!"',
        timeAgo: "2d",
        postImage: IMG_BALI,
      },
      {
        id: "n7",
        type: "like",
        user: {
          username: "chef_marco",
          avatar: { uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80" },
        },
        text: "liked your story.",
        timeAgo: "3d",
        postImage: IMG_FOOD,
      },
      {
        id: "n8",
        type: "follow",
        user: {
          username: "lukas_meyer",
          avatar: { uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&q=80" },
        },
        text: "started following you.",
        timeAgo: "4d",
        isFollowing: false,
      },
    ],
  },
  {
    title: "Earlier",
    items: [
      {
        id: "n9",
        type: "like",
        user: {
          username: "sophie.dupont",
          avatar: { uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80" },
        },
        text: "and 28 others liked your photo.",
        timeAgo: "1w",
        postImage: IMG_CINQUE,
      },
    ],
  },
];

export function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"All" | "Follows" | "Likes" | "Comments">("All");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    n5: true,
  });

  const toggleFollow = (id: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredSections = NOTIFICATIONS_SECTIONS.map((section) => {
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
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 2. Filter Pills Row */}
      <View style={styles.filterRow}>
        {(["All", "Follows", "Likes", "Comments"] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterPillText,
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
      >
        {/* 3. Follow Requests Banner (Instagram Style) */}
        <TouchableOpacity style={styles.requestsBanner} activeOpacity={0.7}>
          <View style={styles.requestsLeft}>
            <View style={styles.requestsBadgeCircle}>
              <Ionicons name="person-add" size={18} color="#0F172A" />
            </View>
            <View>
              <Text style={styles.requestsTitle}>Follow requests</Text>
              <Text style={styles.requestsSubtitle}>Approve or ignore requests</Text>
            </View>
          </View>
          <View style={styles.requestsRight}>
            <View style={styles.requestsCountBadge}>
              <Text style={styles.requestsCountText}>3</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* 4. Time-Grouped Notification List */}
        {filteredSections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item) => {
              const isFollowing = !!followingMap[item.id];
              return (
                <View key={item.id} style={styles.notificationRow}>
                  {/* User Avatar */}
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/profile")}
                    activeOpacity={0.8}
                  >
                    <Image source={item.user.avatar} style={styles.userAvatar} />
                  </TouchableOpacity>

                  {/* Notification Description */}
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                      <Text style={styles.notificationUsername}>
                        {item.user.username}{" "}
                      </Text>
                      {item.text}{" "}
                      <Text style={styles.notificationTime}>{item.timeAgo}</Text>
                    </Text>
                  </View>

                  {/* Right Trailing Action: Follow/Following Button OR Post Thumbnail */}
                  {item.type === "follow" ? (
                    <TouchableOpacity
                      onPress={() => toggleFollow(item.id)}
                      style={[
                        styles.followBtn,
                        isFollowing && styles.followingBtn,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          isFollowing && styles.followingBtnText,
                        ]}
                      >
                        {isFollowing ? "Following" : "Follow Back"}
                      </Text>
                    </TouchableOpacity>
                  ) : item.postImage ? (
                    <TouchableOpacity activeOpacity={0.8}>
                      <Image
                        source={item.postImage}
                        style={styles.postThumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

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
