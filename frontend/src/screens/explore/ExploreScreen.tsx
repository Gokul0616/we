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
  Modal,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_GAP = 1.5;
const SQUARE_SIZE = (SCREEN_WIDTH - TILE_GAP * 2) / 3;
const TALL_HEIGHT = SQUARE_SIZE * 2 + TILE_GAP;

// Local High-Resolution Images
const IMG_SANTORINI = require("../../../assets/images/explore_santorini.jpg");
const IMG_FOOD = require("../../../assets/images/explore_food.jpg");
const IMG_CINQUE = require("../../../assets/images/cinque_terre_post.jpg");
const IMG_BALI = require("../../../assets/images/home_feed_bali_post.jpg");
const IMG_MOUNTAIN = require("../../../assets/images/splash_mountain.jpg");
const IMG_AVATAR = require("../../../assets/images/profile_gokul_avatar.jpg");
const IMG_HERO = require("../../../assets/images/onboarding_hero.jpg");
const IMG_SLIDE_2 = require("../../../assets/images/onboarding_slide_2.jpg");
const IMG_SLIDE_3 = require("../../../assets/images/onboarding_slide_3.jpg");
const IMG_SLIDE_4 = require("../../../assets/images/onboarding_slide_4.jpg");

export interface ExplorePost {
  id: string;
  type: "photo" | "reel" | "carousel";
  image: any;
  author: {
    username: string;
    fullName: string;
    avatar: any;
  };
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

// 18 Rich Explore Posts
const EXPLORE_POSTS: ExplorePost[] = [
  {
    id: "p1",
    type: "photo",
    image: IMG_CINQUE,
    author: {
      username: "elena_travels",
      fullName: "Elena Rossi",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
    },
    caption: "Golden hour along the Italian Riviera 🇮🇹 Nothing beats the sunset over Cinque Terre.",
    likes: 12450,
    comments: 248,
    timeAgo: "2h ago",
  },
  {
    id: "p2",
    type: "photo",
    image: IMG_FOOD,
    author: {
      username: "chef_marco",
      fullName: "Marco Bellini",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
    },
    caption: "Fresh Mediterranean homemade orecchiette with basil and heirloom tomatoes 🍝✨",
    likes: 8920,
    comments: 174,
    timeAgo: "4h ago",
  },
  {
    id: "p3",
    type: "reel",
    image: IMG_SANTORINI,
    author: {
      username: "alex_wanderer",
      fullName: "Alex Rivera",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
    },
    caption: "Living inside a postcard in Santorini. The Aegean blue hits different in October 🇬🇷💙",
    likes: 34100,
    comments: 890,
    timeAgo: "6h ago",
  },
  {
    id: "p4",
    type: "carousel",
    image: IMG_BALI,
    author: {
      username: "bali_vibes",
      fullName: "Wayan Surya",
      avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
    },
    caption: "Quiet mornings in Ubud surrounded by ancient temple shrines and rainforest mist 🌿🙏",
    likes: 15300,
    comments: 312,
    timeAgo: "8h ago",
  },
  {
    id: "p5",
    type: "photo",
    image: IMG_MOUNTAIN,
    author: {
      username: "peak_adventures",
      fullName: "Lukas Meyer",
      avatar: { uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&q=80" },
    },
    caption: "Above the clouds at 3,000 meters. The silence up here is medicine for the soul 🏔️",
    likes: 21800,
    comments: 440,
    timeAgo: "10h ago",
  },
  {
    id: "p6",
    type: "photo",
    image: IMG_HERO,
    author: {
      username: "urban_frames",
      fullName: "Chloe Zhang",
      avatar: { uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&q=80" },
    },
    caption: "Connecting with friends in the heart of the city. Good conversations make lifetime memories ☕🏙️",
    likes: 9640,
    comments: 185,
    timeAgo: "12h ago",
  },
  {
    id: "p7",
    type: "reel",
    image: IMG_SLIDE_2,
    author: {
      username: "visual_storyteller",
      fullName: "Maya Lin",
      avatar: { uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80" },
    },
    caption: "Chasing the early dawn rays across the coastline. Keep creating what makes you feel alive ✨",
    likes: 28400,
    comments: 520,
    timeAgo: "14h ago",
  },
  {
    id: "p8",
    type: "photo",
    image: IMG_SLIDE_3,
    author: {
      username: "design_daily",
      fullName: "David Sterling",
      avatar: { uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80" },
    },
    caption: "Minimalist interior architecture with natural cedar accents and afternoon sunlight 📐🏡",
    likes: 11200,
    comments: 210,
    timeAgo: "16h ago",
  },
  {
    id: "p9",
    type: "photo",
    image: IMG_SLIDE_4,
    author: {
      username: "wander_soul",
      fullName: "Sophie Dupont",
      avatar: { uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80" },
    },
    caption: "Finding calm moments between journeys. Where is your favorite place to recharge? 🗺️✨",
    likes: 13900,
    comments: 295,
    timeAgo: "18h ago",
  },
  {
    id: "p10",
    type: "photo",
    image: IMG_FOOD,
    author: {
      username: "culinary_journal",
      fullName: "Gianna Moretti",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
    },
    caption: "Wood-fired rustic sourdough with virgin olive oil and rosemary sea salt 🍞🫒",
    likes: 7850,
    comments: 132,
    timeAgo: "20h ago",
  },
  {
    id: "p11",
    type: "carousel",
    image: IMG_CINQUE,
    author: {
      username: "coastal_odyssey",
      fullName: "Matteo Bianchi",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
    },
    caption: "Five villages, one unforgettable hike. Italy always knows how to take your breath away 🇮🇹🌊",
    likes: 19400,
    comments: 388,
    timeAgo: "22h ago",
  },
  {
    id: "p12",
    type: "photo",
    image: IMG_SANTORINI,
    author: {
      username: "greece_explorer",
      fullName: "Niko Kasdaglis",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
    },
    caption: "Whitewashed alleys, pink bougainvillea, and warm sea breezes in Oia 🌸🤍",
    likes: 26300,
    comments: 610,
    timeAgo: "1d ago",
  },
];

const RECENT_SEARCHES = [
  { id: "s1", type: "account", title: "alex_wanderer", subtitle: "Alex Rivera", avatar: IMG_AVATAR },
  { id: "s2", type: "tag", title: "#cinqueterre", subtitle: "2.4M posts" },
  { id: "s3", type: "tag", title: "#santorini", subtitle: "5.1M posts" },
  { id: "s4", type: "account", title: "elena_travels", subtitle: "Elena Rossi" },
  { id: "s5", type: "tag", title: "#photography", subtitle: "8.7M posts" },
];

export function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExplorePost | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleSave = (postId: string) => {
    setSavedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Filter posts if search query is active
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return EXPLORE_POSTS;
    const q = searchQuery.toLowerCase().trim();
    return EXPLORE_POSTS.filter(
      (p) =>
        p.author.username.toLowerCase().includes(q) ||
        p.author.fullName.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group posts into 6-item staggered blocks (Pattern A: Tall Reel on Right, Pattern B: Tall Reel on Left)
  const postBlocks = useMemo(() => {
    const blocks: { isTallOnRight: boolean; items: ExplorePost[] }[] = [];
    for (let i = 0; i < filteredPosts.length; i += 6) {
      const slice = filteredPosts.slice(i, i + 6);
      const isTallOnRight = (i / 6) % 2 === 0;
      blocks.push({ isTallOnRight, items: slice });
    }
    return blocks;
  }, [filteredPosts]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Minimal Instagram Search Bar Header */}
      <View style={styles.header}>
        {isSearchFocused && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Keyboard.dismiss();
              setIsSearchFocused(false);
              setSearchQuery("");
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        )}

        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={17} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={17} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Search Overlay Mode */}
      {isSearchFocused ? (
        <ScrollView
          style={styles.searchOverlay}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>
              {searchQuery.trim() ? "Search Results" : "Recent Searches"}
            </Text>
            {!searchQuery.trim() && (
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchQuery.trim() ? (
            filteredPosts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.searchResultRow}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsSearchFocused(false);
                  setSelectedPost(p);
                }}
              >
                <Image source={p.author.avatar} style={styles.searchResultAvatar} />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultUsername}>{p.author.username}</Text>
                  <Text style={styles.searchResultCaption} numberOfLines={1}>
                    {p.caption}
                  </Text>
                </View>
                <Image source={p.image} style={styles.searchResultThumb} resizeMode="cover" />
              </TouchableOpacity>
            ))
          ) : (
            RECENT_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentRow}
                onPress={() => {
                  setSearchQuery(item.title.replace(/^#/, ""));
                }}
              >
                <View style={styles.recentIconCircle}>
                  {item.type === "tag" ? (
                    <Ionicons name="pricetag-outline" size={18} color="#0F172A" />
                  ) : (
                    <Ionicons name="person-outline" size={18} color="#0F172A" />
                  )}
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentItemTitle}>{item.title}</Text>
                  <Text style={styles.recentItemSubtitle}>{item.subtitle}</Text>
                </View>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        /* 3. Classic Instagram Staggered Explore Grid */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridScrollContent}
        >
          {postBlocks.map((block, blockIndex) => {
            const items = block.items;
            const isTallOnRight = block.isTallOnRight;

            // Pattern A: 4 square tiles on left (2x2), 1 tall tile on right (1x2)
            if (isTallOnRight) {
              const squares = items.slice(0, 4);
              const tallItem = items[4] || items[0];
              const remaining = items.slice(5);

              return (
                <View key={`block-${blockIndex}`} style={styles.staggeredBlock}>
                  <View style={styles.staggeredRow}>
                    {/* Left 2x2 Square Grid */}
                    <View style={styles.squares2x2Grid}>
                      <View style={styles.squaresRow}>
                        {squares[0] && renderTile(squares[0], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                        {squares[1] && renderTile(squares[1], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                      </View>
                      <View style={styles.squaresRow}>
                        {squares[2] && renderTile(squares[2], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                        {squares[3] && renderTile(squares[3], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                      </View>
                    </View>

                    {/* Right Tall Tile (Reel/Video) */}
                    {tallItem && renderTile(tallItem, SQUARE_SIZE, TALL_HEIGHT, setSelectedPost, true)}
                  </View>

                  {/* Any remaining item in block */}
                  {remaining.length > 0 && (
                    <View style={styles.standardRow}>
                      {remaining.map((item) =>
                        renderTile(item, SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)
                      )}
                    </View>
                  )}
                </View>
              );
            }

            // Pattern B: 1 tall tile on left (1x2), 4 square tiles on right (2x2)
            const tallItem = items[0];
            const squares = items.slice(1, 5);
            const remaining = items.slice(5);

            return (
              <View key={`block-${blockIndex}`} style={styles.staggeredBlock}>
                <View style={styles.staggeredRow}>
                  {/* Left Tall Tile (Reel/Video) */}
                  {tallItem && renderTile(tallItem, SQUARE_SIZE, TALL_HEIGHT, setSelectedPost, true)}

                  {/* Right 2x2 Square Grid */}
                  <View style={styles.squares2x2Grid}>
                    <View style={styles.squaresRow}>
                      {squares[0] && renderTile(squares[0], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                      {squares[1] && renderTile(squares[1], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                    </View>
                    <View style={styles.squaresRow}>
                      {squares[2] && renderTile(squares[2], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                      {squares[3] && renderTile(squares[3], SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)}
                    </View>
                  </View>
                </View>

                {/* Any remaining item in block */}
                {remaining.length > 0 && (
                  <View style={styles.standardRow}>
                    {remaining.map((item) =>
                      renderTile(item, SQUARE_SIZE, SQUARE_SIZE, setSelectedPost)
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 4. Instagram Style Full Post Detail Modal */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost && (
          <SafeAreaView edges={["top", "bottom"]} style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
                style={styles.modalBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Explore</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              {/* Author Row */}
              <View style={styles.postAuthorRow}>
                <TouchableOpacity
                  style={styles.postAuthorLeft}
                  onPress={() => {
                    setSelectedPost(null);
                    router.push("/(tabs)/profile");
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={selectedPost.author.avatar} style={styles.postAuthorAvatar} />
                  <View>
                    <Text style={styles.postAuthorUsername}>{selectedPost.author.username}</Text>
                    <Text style={styles.postAuthorFullName}>{selectedPost.author.fullName}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.postFollowBtn}>
                  <Text style={styles.postFollowBtnText}>Follow</Text>
                </TouchableOpacity>
              </View>

              {/* Main Media Image */}
              <View style={styles.postMediaWrapper}>
                <Image
                  source={selectedPost.image}
                  style={styles.postMediaImage}
                  resizeMode="cover"
                />
              </View>

              {/* Interactive Actions (Heart, Comment, Share, Bookmark) */}
              <View style={styles.postActionsBar}>
                <View style={styles.postActionsLeft}>
                  <TouchableOpacity
                    onPress={() => toggleLike(selectedPost.id)}
                    style={styles.actionBtn}
                  >
                    <Ionicons
                      name={likedPosts[selectedPost.id] ? "heart" : "heart-outline"}
                      size={26}
                      color={likedPosts[selectedPost.id] ? "#ED4956" : "#0F172A"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={24} color="#0F172A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="paper-plane-outline" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => toggleSave(selectedPost.id)}>
                  <Ionicons
                    name={savedPosts[selectedPost.id] ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color="#0F172A"
                  />
                </TouchableOpacity>
              </View>

              {/* Likes & Caption */}
              <View style={styles.postDetailsSection}>
                <Text style={styles.postLikesText}>
                  {(selectedPost.likes + (likedPosts[selectedPost.id] ? 1 : 0)).toLocaleString()} likes
                </Text>

                <Text style={styles.postCaption}>
                  <Text style={styles.postCaptionAuthor}>{selectedPost.author.username} </Text>
                  {selectedPost.caption}
                </Text>

                <TouchableOpacity style={styles.viewCommentsBtn}>
                  <Text style={styles.viewCommentsText}>
                    View all {selectedPost.comments} comments
                  </Text>
                </TouchableOpacity>

                <Text style={styles.postTimeAgo}>{selectedPost.timeAgo}</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// Helper to render an individual Instagram grid tile
function renderTile(
  post: ExplorePost,
  width: number,
  height: number,
  onPress: (post: ExplorePost) => void,
  isTall: boolean = false
) {
  return (
    <TouchableOpacity
      key={post.id}
      activeOpacity={0.88}
      onPress={() => onPress(post)}
      style={[styles.tile, { width, height }]}
    >
      <Image source={post.image} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Instagram Indicator Badge (Reel / Carousel) */}
      {isTall || post.type === "reel" ? (
        <View style={styles.tileBadge}>
          <Ionicons name="play" size={13} color="#FFFFFF" />
        </View>
      ) : post.type === "carousel" ? (
        <View style={styles.tileBadge}>
          <Ionicons name="copy-outline" size={13} color="#FFFFFF" />
        </View>
      ) : null}
    </TouchableOpacity>
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
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 10,
  },
  searchBarFocused: {
    backgroundColor: "#EFEFEF",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 0,
  },
  gridScrollContent: {
    backgroundColor: "#FFFFFF",
  },
  staggeredBlock: {
    marginBottom: TILE_GAP,
  },
  staggeredRow: {
    flexDirection: "row",
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  squares2x2Grid: {
    width: SQUARE_SIZE * 2 + TILE_GAP,
    height: TALL_HEIGHT,
    gap: TILE_GAP,
  },
  squaresRow: {
    flexDirection: "row",
    gap: TILE_GAP,
  },
  standardRow: {
    flexDirection: "row",
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  tile: {
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    position: "relative",
  },
  tileBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 3,
    borderRadius: 4,
  },
  // Search Overlay
  searchOverlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  recentTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: "#0F172A",
  },
  clearAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentItemTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: "#0F172A",
  },
  recentItemSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 1,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  searchResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
  },
  searchResultCaption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  searchResultThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 8,
  },
  // Modal Post Detail
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  modalBackBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: "#0F172A",
  },
  postAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postAuthorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postAuthorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  postAuthorUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: "#0F172A",
  },
  postAuthorFullName: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: "#64748B",
  },
  postFollowBtn: {
    backgroundColor: "#EFEFEF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postFollowBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: "#0F172A",
  },
  postMediaWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
    backgroundColor: "#000000",
  },
  postMediaImage: {
    width: "100%",
    height: "100%",
  },
  postActionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  postDetailsSection: {
    paddingHorizontal: 14,
  },
  postLikesText: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: "#0F172A",
    marginBottom: 6,
  },
  postCaption: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
    color: "#0F172A",
    lineHeight: 19,
  },
  postCaptionAuthor: {
    fontFamily: FontFamily.bold,
  },
  viewCommentsBtn: {
    marginTop: 6,
  },
  viewCommentsText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#8E8E93",
  },
  postTimeAgo: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 6,
  },
});
