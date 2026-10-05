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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - 4) / 3;

interface HighlightItem {
  id: string;
  title: string;
  image: any;
}

export default function ProfileTab() {
  const [activeTab, setActiveTab] = useState<"Posts" | "Replies" | "Media" | "Likes">("Posts");
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const stats = [
    { label: "Posts", value: "248" },
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

  const gridPhotos = [
    require("../../../assets/images/home_feed_bali_post.jpg"),
    require("../../../assets/images/onboarding_hero.jpg"),
    require("../../../assets/images/cinque_terre_post.jpg"),
    require("../../../assets/images/splash_mountain.jpg"),
    require("../../../assets/images/onboarding_slide_2.jpg"),
    require("../../../assets/images/onboarding_slide_3.jpg"),
    require("../../../assets/images/onboarding_slide_4.jpg"),
    require("../../../assets/images/home_feed_bali_post.jpg"),
    require("../../../assets/images/cinque_terre_post.jpg"),
  ];

  const tabs: Array<"Posts" | "Replies" | "Media" | "Likes"> = [
    "Posts",
    "Replies",
    "Media",
    "Likes",
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header matching Screen 06 */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Image
            source={require("../../../assets/images/profile_gokul_avatar.jpg")}
            style={styles.topHeaderAvatar}
          />
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.7}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={14} color="#64748B" style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsIconBtn} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color="#0F172A" />
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
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Profile Header Row: Avatar on LEFT, Stats on RIGHT */}
        <View style={styles.profileHeaderRow}>
          <Image
            source={require("../../../assets/images/profile_gokul_avatar.jpg")}
            style={styles.avatar}
          />

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
          <Text style={styles.displayName}>Gokul Ssb</Text>
          <Text style={styles.handle}>@gokul_ssb</Text>
          <Text style={styles.bioLine}>Building cool things</Text>
          <Text style={styles.bioLine}>Developer | Traveler | Foodie</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>Bangalore, India</Text>
          </View>
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

          {/* Add New Highlight */}
          <TouchableOpacity style={styles.highlightItem} activeOpacity={0.8}>
            <View style={[styles.highlightRing, styles.highlightAddRing]}>
              <Ionicons name="add" size={24} color="#64748B" />
            </View>
            <Text style={styles.highlightTitle}>New</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sub Tabs: Posts | Replies | Media | Likes */}
        <View style={styles.subTabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.subTabItem, isActive && styles.subTabItemActive]}
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

      {/* Photo Preview Modal */}
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  settingsIconBtn: {
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
  subTabItemActive: {},
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
