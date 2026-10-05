import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

// Local High-Resolution Images
const IMG_SANTORINI = require("../../../assets/images/explore_santorini.jpg");
const IMG_FOOD = require("../../../assets/images/explore_food.jpg");
const IMG_CINQUE = require("../../../assets/images/cinque_terre_post.jpg");
const IMG_BALI = require("../../../assets/images/home_feed_bali_post.jpg");
const IMG_MOUNTAIN = require("../../../assets/images/splash_mountain.jpg");
const IMG_AVATAR = require("../../../assets/images/profile_gokul_avatar.jpg");

interface Creator {
  id: string;
  name: string;
  handle: string;
  followers: string;
  avatar: any;
  category: string;
}

interface ExploreCard {
  id: string;
  title: string;
  postsCount: string;
  image: any;
  category: string;
  tag?: string;
  likes?: string;
}

const CATEGORIES = [
  "For You",
  "Travel",
  "Photography",
  "Food",
  "Lifestyle",
  "Music",
  "Fitness",
];

const QUICK_CATEGORIES = [
  { id: "travel", name: "Travel", icon: "airplane" as const, bg: "#EFF6FF", color: "#2563EB" },
  { id: "food", name: "Food", icon: "restaurant" as const, bg: "#FFFBEB", color: "#D97706" },
  { id: "photo", name: "Photography", icon: "camera" as const, bg: "#F5F3FF", color: "#7C3AED" },
  { id: "lifestyle", name: "Lifestyle", icon: "sparkles" as const, bg: "#FFF1F2", color: "#E11D48" },
];

const CREATORS_DATA: Creator[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    handle: "sarah.j",
    followers: "124K",
    avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
    category: "Travel & Lifestyle",
  },
  {
    id: "2",
    name: "Alex Carter",
    handle: "alex.c",
    followers: "98K",
    avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
    category: "Photography",
  },
  {
    id: "3",
    name: "Priya Sharma",
    handle: "priya.s",
    followers: "76K",
    avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
    category: "Food & Culinary",
  },
  {
    id: "4",
    name: "Daniel Kim",
    handle: "daniel.k",
    followers: "62K",
    avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
    category: "Adventure",
  },
];

const EXPLORE_COLLECTIONS: ExploreCard[] = [
  {
    id: "c1",
    title: "Beautiful places in Italy 🇮🇹",
    postsCount: "12.4K posts",
    image: IMG_CINQUE,
    category: "Travel",
    likes: "9.8K",
  },
  {
    id: "c2",
    title: "Culinary & Dining",
    postsCount: "9.3K posts",
    image: IMG_FOOD,
    category: "Food",
    likes: "7.4K",
  },
  {
    id: "c3",
    title: "Adventure Seekers",
    postsCount: "15.2K posts",
    image: IMG_BALI,
    category: "Travel",
    likes: "12.1K",
  },
  {
    id: "c4",
    title: "Mountain Escapes",
    postsCount: "8.7K posts",
    image: IMG_MOUNTAIN,
    category: "Photography",
    likes: "6.9K",
  },
  {
    id: "c5",
    title: "Hidden Gems in Greece",
    postsCount: "24.8K posts",
    image: IMG_SANTORINI,
    category: "Travel",
    likes: "18.3K",
  },
];

export function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isSearchActive, setIsSearchActive] = useState(false);

  const toggleFollow = (creatorId: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [creatorId]: !prev[creatorId],
    }));
  };

  // Filter collections based on category or search query
  const filteredCollections = useMemo(() => {
    let list = EXPLORE_COLLECTIONS;
    if (selectedCategory !== "For You") {
      list = list.filter((c) => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  // Filter creators for search
  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return CREATORS_DATA;
    const q = searchQuery.toLowerCase().trim();
    return CREATORS_DATA.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header with WE Brand & Explore Title */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.weBrand}>WE</Text>
          <Text style={styles.screenTitle}>Explore</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsSearchActive(!isSearchActive)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="search-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Image source={IMG_AVATAR} style={styles.headerAvatar} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Modern Rounded Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people, topics, places..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchActive(true)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {}}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="options-outline" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Results Mode */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsSection}>
            <Text style={styles.sectionHeader}>People</Text>
            {filteredCreators.map((creator) => {
              const isFollowing = !!followingMap[creator.id];
              return (
                <View key={creator.id} style={styles.creatorListCard}>
                  <Image source={creator.avatar} style={styles.creatorListAvatar} />
                  <View style={styles.creatorListInfo}>
                    <Text style={styles.creatorListName}>{creator.name}</Text>
                    <Text style={styles.creatorListHandle}>@{creator.handle}</Text>
                    <Text style={styles.creatorListMeta}>{creator.followers} followers • {creator.category}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFollow(creator.id)}
                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <>
            {/* 4. Featured Hero Banner Card (Screen 1 & Screen 7) */}
            {selectedCategory === "For You" && (
              <View style={styles.heroBannerContainer}>
                <TouchableOpacity
                  style={styles.heroCard}
                  activeOpacity={0.92}
                  onPress={() => setSelectedCategory("Travel")}
                >
                  <Image source={IMG_SANTORINI} style={styles.heroBgImage} />
                  <View style={styles.heroGradientOverlay} />
                  <View style={styles.heroContent}>
                    <View style={styles.heroPill}>
                      <Text style={styles.heroPillText}>EXPLORE</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                      Good vibes,{"\n"}new discoveries.
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      Explore what's happening around you.
                    </Text>
                    <View style={styles.heroStatsRow}>
                      <Ionicons name="sparkles" size={14} color="#FBBF24" />
                      <Text style={styles.heroStatsText}>24.8K trending stories today</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* 5. Circular Category Icons Row (Screen 7 Inspiration) */}
            <View style={styles.quickNavSection}>
              {QUICK_CATEGORIES.map((item) => {
                const isSelected = selectedCategory.toLowerCase() === item.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedCategory(item.name)}
                    style={styles.quickNavItem}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.quickNavIconCircle,
                        { backgroundColor: item.bg },
                        isSelected && { borderColor: item.color, borderWidth: 2 },
                      ]}
                    >
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={[styles.quickNavText, isSelected && { color: item.color, fontWeight: "700" }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 6. Popular People Horizontal Carousel (Screen 2 Inspiration) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Popular People</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorsCarousel}
            >
              {CREATORS_DATA.map((creator) => {
                const isFollowing = !!followingMap[creator.id];
                return (
                  <View key={creator.id} style={styles.creatorCard}>
                    <Image source={creator.avatar} style={styles.creatorAvatar} />
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {creator.name}
                    </Text>
                    <Text style={styles.creatorFollowers}>
                      {creator.followers} followers
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleFollow(creator.id)}
                      style={[styles.creatorFollowBtn, isFollowing && styles.creatorFollowingBtn]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.creatorFollowBtnText,
                          isFollowing && styles.creatorFollowingBtnText,
                        ]}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            {/* 7. Featured Collections Grid (Screen 1 & Screen 3) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                {selectedCategory === "For You" ? "Trending Topics" : `${selectedCategory} Collections`}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory("For You")}>
                <Text style={styles.seeAllText}>
                  {selectedCategory !== "For You" ? "Reset" : "See all"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 8. 2-Column Visual Cards Grid */}
        <View style={styles.gridContainer}>
          {filteredCollections.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridCard}
              activeOpacity={0.9}
              onPress={() => {}}
            >
              <Image source={item.image} style={styles.gridCardImage} />
              <View style={styles.gridCardGradient} />
              
              {/* Top Tag & Like count */}
              <View style={styles.gridCardTopRow}>
                <View style={styles.gridCategoryBadge}>
                  <Text style={styles.gridCategoryBadgeText}>{item.category}</Text>
                </View>
                {item.likes && (
                  <View style={styles.gridLikesBadge}>
                    <Ionicons name="heart" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.gridLikesText}>{item.likes}</Text>
                  </View>
                )}
              </View>

              {/* Bottom Content Info */}
              <View style={styles.gridCardBottom}>
                <Text style={styles.gridCardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.gridCardPostsCount}>
                  {item.postsCount}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    justifyContent: "center",
  },
  weBrand: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
  },
  headerIconBtn: {
    padding: 4,
  },
  avatarBtn: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  categoryPillsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  heroBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroCard: {
    height: 190,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    padding: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },
  heroContent: {
    zIndex: 1,
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  heroStatsText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  quickNavSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickNavItem: {
    alignItems: "center",
    gap: 6,
  },
  quickNavIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  quickNavText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  creatorsCarousel: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 22,
  },
  creatorCard: {
    width: 120,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  creatorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  creatorFollowers: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 10,
  },
  creatorFollowBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 78,
    alignItems: "center",
  },
  creatorFollowingBtn: {
    backgroundColor: "#E2E8F0",
  },
  creatorFollowBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  creatorFollowingBtnText: {
    color: "#334155",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#1E293B",
  },
  gridCardImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  gridCardGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  gridCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridCategoryBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridCategoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gridLikesBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridLikesText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  gridCardBottom: {
    zIndex: 1,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridCardPostsCount: {
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: 3,
    fontWeight: "500",
  },
  searchResultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  creatorListCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  creatorListAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  creatorListInfo: {
    flex: 1,
  },
  creatorListName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  creatorListHandle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  creatorListMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: "#E2E8F0",
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  followingBtnText: {
    color: "#334155",
  },
});
