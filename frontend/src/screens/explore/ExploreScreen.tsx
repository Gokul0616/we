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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  category: string;
  image: any;
  author: {
    username: string;
    fullName: string;
    avatar: any;
    isMe?: boolean;
  };
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

// 18 Rich Explore Posts
export const EXPLORE_POSTS: ExplorePost[] = [
  {
    id: "p1",
    type: "photo",
    category: "Travel",
    image: IMG_CINQUE,
    author: {
      username: "elena_travels",
      fullName: "Elena Rossi",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
      isMe: false,
    },
    caption: "Golden hour along the Italian Riviera 🇮🇹 Nothing beats the sunset over Cinque Terre.",
    likes: 12450,
    comments: 248,
    timeAgo: "2h ago",
  },
  {
    id: "p2",
    type: "photo",
    category: "Food",
    image: IMG_FOOD,
    author: {
      username: "chef_marco",
      fullName: "Marco Bellini",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
      isMe: false,
    },
    caption: "Fresh Mediterranean homemade orecchiette with basil and heirloom tomatoes 🍝✨",
    likes: 8920,
    comments: 174,
    timeAgo: "4h ago",
  },
  {
    id: "p3",
    type: "reel",
    category: "Travel",
    image: IMG_SANTORINI,
    author: {
      username: "alex_wanderer",
      fullName: "Alex Rivera",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      isMe: false,
    },
    caption: "Living inside a postcard in Santorini. The Aegean blue hits different in October 🇬🇷💙",
    likes: 34100,
    comments: 890,
    timeAgo: "6h ago",
  },
  {
    id: "p4",
    type: "carousel",
    category: "Travel",
    image: IMG_BALI,
    author: {
      username: "gokul_ssb",
      fullName: "Gokul Ssb",
      avatar: IMG_AVATAR,
      isMe: true, // MY POST!
    },
    caption: "Quiet mornings in Ubud surrounded by ancient temple shrines and rainforest mist 🌿🙏",
    likes: 15300,
    comments: 312,
    timeAgo: "8h ago",
  },
  {
    id: "p5",
    type: "photo",
    category: "Nature",
    image: IMG_MOUNTAIN,
    author: {
      username: "gokul_ssb",
      fullName: "Gokul Ssb",
      avatar: IMG_AVATAR,
      isMe: true, // MY POST!
    },
    caption: "Above the clouds at 3,000 meters. The silence up here is medicine for the soul 🏔️",
    likes: 21800,
    comments: 440,
    timeAgo: "10h ago",
  },
  {
    id: "p6",
    type: "photo",
    category: "Photography",
    image: IMG_HERO,
    author: {
      username: "urban_frames",
      fullName: "Chloe Zhang",
      avatar: { uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&q=80" },
      isMe: false,
    },
    caption: "Connecting with friends in the heart of the city. Good conversations make lifetime memories ☕🏙️",
    likes: 9640,
    comments: 185,
    timeAgo: "12h ago",
  },
  {
    id: "p7",
    type: "reel",
    category: "Nature",
    image: IMG_SLIDE_2,
    author: {
      username: "maya_lin",
      fullName: "Maya Lin",
      avatar: { uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80" },
      isMe: false,
    },
    caption: "Chasing the early dawn rays across the coastline. Keep creating what makes you feel alive ✨",
    likes: 28400,
    comments: 520,
    timeAgo: "14h ago",
  },
  {
    id: "p8",
    type: "photo",
    category: "Architecture",
    image: IMG_SLIDE_3,
    author: {
      username: "design_daily",
      fullName: "David Sterling",
      avatar: { uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80" },
      isMe: false,
    },
    caption: "Minimalist interior architecture with natural cedar accents and afternoon sunlight 📐🏡",
    likes: 11200,
    comments: 210,
    timeAgo: "16h ago",
  },
  {
    id: "p9",
    type: "photo",
    category: "Travel",
    image: IMG_SLIDE_4,
    author: {
      username: "wander_soul",
      fullName: "Sophie Dupont",
      avatar: { uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&q=80" },
      isMe: false,
    },
    caption: "Finding calm moments between journeys. Where is your favorite place to recharge? 🗺️✨",
    likes: 13900,
    comments: 295,
    timeAgo: "18h ago",
  },
  {
    id: "p10",
    type: "photo",
    category: "Food",
    image: IMG_FOOD,
    author: {
      username: "culinary_journal",
      fullName: "Gianna Moretti",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
      isMe: false,
    },
    caption: "Wood-fired rustic sourdough with virgin olive oil and rosemary sea salt 🍞🫒",
    likes: 7850,
    comments: 132,
    timeAgo: "20h ago",
  },
  {
    id: "p11",
    type: "carousel",
    category: "Travel",
    image: IMG_CINQUE,
    author: {
      username: "coastal_odyssey",
      fullName: "Matteo Bianchi",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
      isMe: false,
    },
    caption: "Five villages, one unforgettable hike. Italy always knows how to take your breath away 🇮🇹🌊",
    likes: 19400,
    comments: 388,
    timeAgo: "22h ago",
  },
  {
    id: "p12",
    type: "photo",
    category: "Architecture",
    image: IMG_SANTORINI,
    author: {
      username: "greece_explorer",
      fullName: "Niko Kasdaglis",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      isMe: false,
    },
    caption: "Whitewashed alleys, pink bougainvillea, and warm sea breezes in Oia 🌸🤍",
    likes: 26300,
    comments: 610,
    timeAgo: "1d ago",
  },
  {
    id: "p13",
    type: "reel",
    category: "Food",
    image: IMG_FOOD,
    author: {
      username: "chef_marco",
      fullName: "Marco Bellini",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
      isMe: false,
    },
    caption: "Tasting notes from Napoli: the crunch of sourdough crust meets aged buffalo mozzarella 🍕",
    likes: 31200,
    comments: 480,
    timeAgo: "1d ago",
  },
  {
    id: "p14",
    type: "photo",
    category: "Nature",
    image: IMG_MOUNTAIN,
    author: {
      username: "peak_adventures",
      fullName: "Lukas Meyer",
      avatar: { uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&q=80" },
      isMe: false,
    },
    caption: "Sunrise ridge lines in the Alps. The best views come after the hardest climbs ☀️🧗‍♂️",
    likes: 17800,
    comments: 290,
    timeAgo: "2d ago",
  },
  {
    id: "p15",
    type: "photo",
    category: "Photography",
    image: IMG_HERO,
    author: {
      username: "urban_frames",
      fullName: "Chloe Zhang",
      avatar: { uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&q=80" },
      isMe: false,
    },
    caption: "Street silhouettes under the evening marquee lights. Capturing raw urban pulse 🌆",
    likes: 14200,
    comments: 215,
    timeAgo: "2d ago",
  },
  {
    id: "p16",
    type: "carousel",
    category: "Style",
    image: IMG_SLIDE_3,
    author: {
      username: "style_journal",
      fullName: "Aria Thorne",
      avatar: { uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80" },
      isMe: false,
    },
    caption: "Autumn palette in layers: oversized trench, structured wool, and muted tones 🍂🧥",
    likes: 18900,
    comments: 340,
    timeAgo: "3d ago",
  },
  {
    id: "p17",
    type: "photo",
    category: "Travel",
    image: IMG_BALI,
    author: {
      username: "gokul_ssb",
      fullName: "Gokul Ssb",
      avatar: IMG_AVATAR,
      isMe: true, // MY POST!
    },
    caption: "Green rice terrace cascades stretching into infinity under the tropical sunrise 🌾",
    likes: 22400,
    comments: 410,
    timeAgo: "3d ago",
  },
  {
    id: "p18",
    type: "reel",
    category: "Travel",
    image: IMG_CINQUE,
    author: {
      username: "elena_travels",
      fullName: "Elena Rossi",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
      isMe: false,
    },
    caption: "Sailing through the turquoise bays of Vernazza. Pure summer nostalgia ⛵🇮🇹",
    likes: 42100,
    comments: 920,
    timeAgo: "4d ago",
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "sparkles" },
  { id: "Travel", label: "Travel", icon: "airplane" },
  { id: "Food", label: "Food", icon: "restaurant" },
  { id: "Nature", label: "Nature", icon: "leaf" },
  { id: "Architecture", label: "Architecture", icon: "business" },
  { id: "Photography", label: "Photography", icon: "camera" },
  { id: "Style", label: "Style", icon: "shirt" },
];

type GridSection =
  | { type: "patternA"; squares: ExplorePost[]; tall: ExplorePost } // 4 squares (left 2x2) + 1 tall (right) = 5 items
  | { type: "patternB"; tall: ExplorePost; squares: ExplorePost[] } // 1 tall (left) + 4 squares (right 2x2) = 5 items
  | { type: "row3"; items: ExplorePost[] }; // exactly 3 squares in a single row

export function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewPost, setPreviewPost] = useState<ExplorePost | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  // Route to My Profile or Others' Profile based on ownership
  const handleAuthorPress = (author: { username: string; fullName: string; isMe?: boolean }) => {
    if (author.isMe || author.username === "gokul_ssb" || author.username === "gokul7") {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/user-profile",
        params: {
          username: author.username,
          name: author.fullName,
        },
      });
    }
  };

  const handlePostPress = (post: ExplorePost) => {
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  };

  const handlePostLongPress = (post: ExplorePost) => {
    setPreviewPost(post);
  };

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

  // Filter posts based on category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return EXPLORE_POSTS;
    const filtered = EXPLORE_POSTS.filter((p) => p.category === selectedCategory);
    return filtered.length > 0 ? filtered : EXPLORE_POSTS;
  }, [selectedCategory]);

  // Perfectly balanced, seamless gapless grid sections (NEVER leaves any empty slots or holes)
  const gridSections = useMemo<GridSection[]>(() => {
    const list = [...filteredPosts];
    const sections: GridSection[] = [];
    let cursor = 0;
    let patternToggle = 0;

    while (cursor < list.length) {
      const remaining = list.length - cursor;

      if (remaining >= 5) {
        if (patternToggle % 2 === 0) {
          // Pattern A: 4 squares on left (2x2), 1 tall on right (takes 5 items)
          const squares = list.slice(cursor, cursor + 4);
          const tall = list[cursor + 4];
          sections.push({ type: "patternA", squares, tall });
          cursor += 5;
        } else {
          // Pattern B: 1 tall on left, 4 squares on right (2x2) (takes 5 items)
          const tall = list[cursor];
          const squares = list.slice(cursor + 1, cursor + 5);
          sections.push({ type: "patternB", tall, squares });
          cursor += 5;
        }
        patternToggle++;
      } else {
        // We have 1, 2, 3, or 4 items remaining.
        // Group them into full 3-column rows. If the final row has 1 or 2 items, pad from start of list so there are ZERO gaps!
        while (cursor < list.length) {
          const rowItems = list.slice(cursor, cursor + 3);
          let padIdx = 0;
          while (rowItems.length < 3 && padIdx < list.length) {
            rowItems.push(list[padIdx]);
            padIdx++;
          }
          sections.push({ type: "row3", items: rowItems });
          cursor += 3;
        }
      }
    }

    return sections;
  }, [filteredPosts]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Dedicated Search Launcher (Navigates to /search route, NO in-page state display) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.searchBarBtn}
          activeOpacity={0.82}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={17} color="#8E8E93" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search creators, places, tags...</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Interactive Horizontal Category Channel Pills */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? "#FFFFFF" : "#64748B"}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. 100% Gapless Staggered Instagram Media Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridScrollContent}
      >
        {gridSections.map((section, secIndex) => {
          if (section.type === "patternA") {
            return (
              <View key={`sec-${secIndex}`} style={styles.staggeredRow}>
                {/* Left 2x2 Squares */}
                <View style={styles.squares2x2Grid}>
                  <View style={styles.squaresRow}>
                    {renderRichTile(
                      section.squares[0],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                    {renderRichTile(
                      section.squares[1],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                  </View>
                  <View style={styles.squaresRow}>
                    {renderRichTile(
                      section.squares[2],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                    {renderRichTile(
                      section.squares[3],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                  </View>
                </View>

                {/* Right Tall Reel/Video */}
                {renderRichTile(
                  section.tall,
                  SQUARE_SIZE,
                  TALL_HEIGHT,
                  handlePostPress,
                  handlePostLongPress,
                  true
                )}
              </View>
            );
          }

          if (section.type === "patternB") {
            return (
              <View key={`sec-${secIndex}`} style={styles.staggeredRow}>
                {/* Left Tall Reel/Video */}
                {renderRichTile(
                  section.tall,
                  SQUARE_SIZE,
                  TALL_HEIGHT,
                  handlePostPress,
                  handlePostLongPress,
                  true
                )}

                {/* Right 2x2 Squares */}
                <View style={styles.squares2x2Grid}>
                  <View style={styles.squaresRow}>
                    {renderRichTile(
                      section.squares[0],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                    {renderRichTile(
                      section.squares[1],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                  </View>
                  <View style={styles.squaresRow}>
                    {renderRichTile(
                      section.squares[2],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                    {renderRichTile(
                      section.squares[3],
                      SQUARE_SIZE,
                      SQUARE_SIZE,
                      handlePostPress,
                      handlePostLongPress
                    )}
                  </View>
                </View>
              </View>
            );
          }

          // Standard 3-Item Row
          return (
            <View key={`sec-${secIndex}`} style={styles.standardRow}>
              {section.items.map((item, itemIdx) => (
                <React.Fragment key={`${item.id}-${secIndex}-${itemIdx}`}>
                  {renderRichTile(
                    item,
                    SQUARE_SIZE,
                    SQUARE_SIZE,
                    handlePostPress,
                    handlePostLongPress
                  )}
                </React.Fragment>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 4. Instagram Style Peek & Pop Quick Preview (Long Press Only) */}
      {previewPost && (
        <View style={styles.peekOverlay}>
          <TouchableOpacity
            style={styles.peekBackdrop}
            activeOpacity={1}
            onPress={() => setPreviewPost(null)}
          />
          <View style={styles.peekCard}>
            {/* Author */}
            <TouchableOpacity
              style={styles.peekHeader}
              activeOpacity={0.8}
              onPress={() => {
                const p = previewPost;
                setPreviewPost(null);
                handleAuthorPress(p.author);
              }}
            >
              <Image source={previewPost.author.avatar} style={styles.peekAvatar} />
              <View>
                <Text style={styles.peekUsername}>
                  {previewPost.author.username} {previewPost.author.isMe && "• (You)"}
                </Text>
                <Text style={styles.peekFullName}>
                  {previewPost.author.isMe ? "Tap to view Your Profile" : previewPost.author.fullName}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Media */}
            <Image source={previewPost.image} style={styles.peekImage} resizeMode="cover" />

            {/* Actions */}
            <View style={styles.peekActions}>
              <TouchableOpacity
                style={styles.peekActionBtn}
                onPress={() => toggleLike(previewPost.id)}
              >
                <Ionicons
                  name={likedPosts[previewPost.id] ? "heart" : "heart-outline"}
                  size={24}
                  color={likedPosts[previewPost.id] ? "#ED4956" : "#0F172A"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.peekActionBtn}
                onPress={() => {
                  const p = previewPost;
                  setPreviewPost(null);
                  handlePostPress(p);
                }}
              >
                <Ionicons name="chatbubble-outline" size={22} color="#0F172A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.peekActionBtn}
                onPress={() => toggleSave(previewPost.id)}
              >
                <Ionicons
                  name={savedPosts[previewPost.id] ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color="#0F172A"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper to render an individual rich Instagram grid tile with dynamic scrim & badges
function renderRichTile(
  post: ExplorePost,
  width: number,
  height: number,
  onPress: (post: ExplorePost) => void,
  onLongPress: (post: ExplorePost) => void,
  isTall: boolean = false
) {
  const isVideo = isTall || post.type === "reel";
  const viewsOrLikes = isVideo
    ? `▶ ${(post.likes * 2.5).toLocaleString()}`
    : `❤️ ${post.likes >= 1000 ? (post.likes / 1000).toFixed(1) + "k" : post.likes}`;

  return (
    <TouchableOpacity
      key={post.id}
      activeOpacity={0.88}
      onPress={() => onPress(post)}
      onLongPress={() => onLongPress(post)}
      delayLongPress={220}
      style={[styles.tile, { width, height }]}
    >
      <Image source={post.image} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Modern Frosted Scrim with Metrics at bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0, 0, 0, 0.65)"]}
        style={styles.tileBottomScrim}
      >
        <Text style={styles.tileMetricText}>{viewsOrLikes}</Text>
      </LinearGradient>

      {/* Instagram Indicator Badge (Reel / Carousel) in top-right */}
      {isVideo ? (
        <View style={styles.tileBadge}>
          <Ionicons name="play" size={12} color="#FFFFFF" />
        </View>
      ) : post.type === "carousel" ? (
        <View style={styles.tileBadge}>
          <Ionicons name="copy-outline" size={12} color="#FFFFFF" />
        </View>
      ) : null}

      {/* "You" Indicator Tag if this post is mine */}
      {post.author.isMe && (
        <View style={styles.tileMyPostTag}>
          <Text style={styles.tileMyPostTagText}>You</Text>
        </View>
      )}
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
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  searchBarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: "#8E8E93",
  },
  // Category Pills
  categoriesSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  categoriesContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPillActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  categoryPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontFamily: FontFamily.bold,
  },
  // Grid
  gridScrollContent: {
    backgroundColor: "#FFFFFF",
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
    height: SQUARE_SIZE,
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
  tileBottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 38,
    justifyContent: "flex-end",
    paddingHorizontal: 7,
    paddingBottom: 6,
  },
  tileMetricText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tileBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tileMyPostTag: {
    position: "absolute",
    top: 7,
    left: 7,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tileMyPostTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: "#FFFFFF",
  },
  // Peek & Pop Overlay
  peekOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  peekBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  peekCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  peekHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  peekAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  peekUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: "#0F172A",
  },
  peekFullName: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: "#64748B",
  },
  peekImage: {
    width: "100%",
    height: SCREEN_WIDTH - 48,
    backgroundColor: "#000000",
  },
  peekActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#F1F5F9",
  },
  peekActionBtn: {
    padding: 8,
  },
});
