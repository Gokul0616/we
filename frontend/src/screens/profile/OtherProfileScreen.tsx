import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";
import { toast } from "../../services/toastService";

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

export function OtherProfileScreen({
  username = "alex_wanderer",
  name = "Alex Wanderer",
  avatar,
  location = "Bali, Indonesia",
  bio = "Travel & Landscape Photographer 📷\nExploring the world one cliff at a time 🌊",
  onBack,
  onMessage,
}: OtherProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(18400);
  const [activeTab, setActiveTab] = useState<"Posts" | "Replies" | "Media" | "Likes">("Posts");
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  const displayAvatar = avatar || require("../../../assets/images/home_feed_bali_post.jpg");

  const stats = [
    { label: "Posts", value: "142" },
    {
      label: "Followers",
      value: followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : String(followersCount),
    },
    { label: "Following", value: "412" },
  ];

  const highlights = [
    { id: "1", title: "Bali", image: require("../../../assets/images/home_feed_bali_post.jpg") },
    { id: "2", title: "Italy", image: require("../../../assets/images/cinque_terre_post.jpg") },
    { id: "3", title: "Iceland", image: require("../../../assets/images/splash_mountain.jpg") },
    { id: "4", title: "Moments", image: require("../../../assets/images/onboarding_hero.jpg") },
  ];

  const gridPhotos = [
    require("../../../assets/images/home_feed_bali_post.jpg"),
    require("../../../assets/images/cinque_terre_post.jpg"),
    require("../../../assets/images/splash_mountain.jpg"),
    require("../../../assets/images/onboarding_slide_2.jpg"),
    require("../../../assets/images/onboarding_hero.jpg"),
    require("../../../assets/images/onboarding_slide_3.jpg"),
    require("../../../assets/images/onboarding_slide_4.jpg"),
    require("../../../assets/images/home_feed_bali_post.jpg"),
    require("../../../assets/images/cinque_terre_post.jpg"),
  ];

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
      toast.info(`Unfollowed @${username}`);
    } else {
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      toast.success(`Following @${username}`);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerUsername}>@{username}</Text>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Row: Avatar on LEFT, Stats on RIGHT */}
        <View style={styles.profileHeaderRow}>
          <Image source={displayAvatar} style={styles.avatar} />

          <View style={styles.statsContainerRight}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statColumn}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio & Details Section Underneath */}
        <View style={styles.bioSection}>
          <Text style={styles.displayName}>{name}</Text>
          <Text style={styles.handle}>@{username}</Text>
          <Text style={styles.bioLine}>{bio}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons: Follow / Following & Message */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleToggleFollow}
            activeOpacity={0.88}
          >
            {isFollowing ? (
              <View style={styles.followingContent}>
                <Ionicons name="checkmark" size={16} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.followingBtnText}>Following</Text>
              </View>
            ) : (
              <Text style={styles.followBtnText}>Follow</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageBtn}
            onPress={onMessage}
            activeOpacity={0.88}
          >
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Story Highlights Horizontal Tray */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.highlightsTray}
        >
          {highlights.map((item) => (
            <TouchableOpacity key={item.id} style={styles.highlightItem} activeOpacity={0.8}>
              <View style={styles.highlightRing}>
                <Image source={item.image} style={styles.highlightThumb} />
              </View>
              <Text style={styles.highlightTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sub Tabs: Posts | Replies | Media | Likes */}
        <View style={styles.subTabsContainer}>
          {(["Posts", "Replies", "Media", "Likes"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.subTabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  {tab}
                </Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3-Column Photo Grid */}
        <View style={styles.photoGrid}>
          {gridPhotos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridTile}
              activeOpacity={0.88}
              onPress={() => setSelectedPhoto(photo)}
            >
              <Image source={photo} style={styles.gridImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Full Photo Preview Modal */}
      <Modal visible={Boolean(selectedPhoto)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={selectedPhoto}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    fontWeight: "700",
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
    paddingBottom: 4,
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
    alignItems: "center",
    marginLeft: 18,
  },
  statColumn: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 12.5,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 3,
  },
  displayName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  handle: {
    fontSize: 13.5,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  bioLine: {
    fontSize: 14.5,
    lineHeight: 20,
    color: "#334155",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 12,
  },
  followBtn: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  followingBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  followingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  followBtnText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  followingBtnText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  messageBtn: {
    flex: 1,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  messageBtnText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  highlightsTray: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
  },
  subTabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginTop: 8,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  subTabTextActive: {
    color: "#0F172A",
    fontWeight: "700",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: width * 0.95,
    height: width * 1.2,
    borderRadius: 16,
  },
});
