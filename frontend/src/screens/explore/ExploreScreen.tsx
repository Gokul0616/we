import React, { useState, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Animated,
  Vibration,
  Platform,
} from "react-native";
import { MenuView } from "@expo/ui/community/menu";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { authStorage, StoredUser } from "../../services/authStorage";

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
const IMG_AVATAR = require("../../../assets/images/default_avatar.png");
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
    id: "p4",
    type: "carousel",
    category: "Travel",
    image: IMG_BALI,
    author: {
      username: "me",
      fullName: "You",
      avatar: IMG_AVATAR,
      isMe: true, // MY POST!
    },
    caption: "Quiet mornings in Ubud surrounded by ancient temple shrines and rainforest mist 🌿🙏",
    likes: 15300,
    comments: 312,
    timeAgo: "8h ago",
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
    id: "p5",
    type: "photo",
    category: "Nature",
    image: IMG_MOUNTAIN,
    author: {
      username: "me",
      fullName: "You",
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
      username: "me",
      fullName: "You",
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
    image: IMG_SLIDE_2,
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

const USERNAME_TO_CHAT: Record<string, string> = {
  alex_wanderer: "c1",
  sarah_jenkins: "c2",
  david_design: "c3",
  daniel_k: "c4",
  elena_travels: "c5",
  chef_marco: "c6",
};

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
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewPost, setPreviewPost] = useState<ExplorePost | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  React.useEffect(() => {
    authStorage.getUser().then(u => setCurrentUser(u));
  }, []);

  // Animation values for Instagram Peek & Pop
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  // Route to My Profile or Others' Profile based on ownership
  const handleAuthorPress = (author: { username: string; fullName: string; isMe?: boolean }) => {
    if (author.isMe || (currentUser?.username && currentUser.username === author.username)) {
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
    const mediaUri = typeof post.image === "object" && post.image?.uri ? post.image.uri : undefined;
    const avatarUri = typeof post.author?.avatar === "object" && post.author?.avatar?.uri ? post.author.avatar.uri : undefined;
    router.push({
      pathname: "/post/[id]",
      params: {
        id: post.id,
        media_url: mediaUri,
        caption: post.caption,
        author_username: post.author.username,
        author_fullName: post.author.fullName,
        author_avatar: avatarUri,
        likes_count: String(post.likes || 0),
        comments_count: String(post.comments || 0),
      },
    });
  };

  // iOS Native Context Menu Action Handler
  const handleNativeAction = (actionId: string, post: ExplorePost) => {
    switch (actionId) {
      case "like":
        toggleLike(post.id);
        break;
      case "repost":
        try {
          Vibration.vibrate(25);
        } catch (_) {}
        break;
      case "share": {
        const authorUser = post.author.username;
        const chatId = USERNAME_TO_CHAT[authorUser] || "c1";
        router.push({
          pathname: "/chat/[id]",
          params: { id: chatId },
        });
        break;
      }
      case "view_profile":
        handleAuthorPress(post.author);
        break;
      case "not_interested":
        try {
          Vibration.vibrate(20);
        } catch (_) {}
        break;
      case "report":
        try {
          Vibration.vibrate(40);
        } catch (_) {}
        break;
    }
  };

  const renderTile = (
    post: ExplorePost,
    width: number,
    height: number,
    isTall: boolean = false
  ) => {
    return renderRichTile(
      post,
      width,
      height,
      handlePostPress,
      handlePostLongPress,
      isTall,
      !!likedPosts[post.id],
      handleNativeAction
    );
  };

  // Instagram-style long-press Peek with spring physics animation & tactile feedback
  const handlePostLongPress = (post: ExplorePost) => {
    try {
      Vibration.vibrate(35);
    } catch (_) { }

    setPreviewPost(post);
    scaleAnim.setValue(0.85);
    backdropAnim.setValue(0);
    actionsAnim.setValue(0);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 110,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(actionsAnim, {
        toValue: 1,
        tension: 90,
        friction: 8,
        delay: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Smooth Instagram exit animation
  const closePreview = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPreviewPost(null);
      if (callback) callback();
    });
  };

  const toggleLike = (postId: string) => {
    try {
      Vibration.vibrate(25);
    } catch (_) { }
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleSave = (postId: string) => {
    try {
      Vibration.vibrate(25);
    } catch (_) { }
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

  // Perfectly balanced, seamless gapless grid sections.
  // 1. Starts with a standard 3-square row (Row 1):
  //    Item 0 (Elena Rossi - Cinque Terre) is a 1:1 SQUARE tile, ensuring the full village,
  //    cliffs, harbor, and sunset sky are visible in the grid without zoom distortion!
  // 2. Alternates Pattern A (4 squares left + 1 tall reel right) and Pattern B (1 tall reel left + 4 squares right),
  //    guaranteeing that tall vertical slots receive actual vertical reels!
  const gridSections = useMemo<GridSection[]>(() => {
    const list = [...filteredPosts];
    const sections: GridSection[] = [];
    let cursor = 0;
    let patternToggle = 0;

    // Row 1: Always start with 3 square posts!
    if (list.length >= 3) {
      sections.push({ type: "row3", items: list.slice(0, 3) });
      cursor = 3;
    }

    while (cursor < list.length) {
      const remaining = list.length - cursor;

      if (remaining >= 5) {
        const chunk = list.slice(cursor, cursor + 5);
        // Prioritize placing actual reels into the tall slot
        const reelIdx = chunk.findIndex((p) => p.type === "reel");
        let tall: ExplorePost;
        let squares: ExplorePost[];

        if (reelIdx !== -1) {
          tall = chunk[reelIdx];
          squares = chunk.filter((_, idx) => idx !== reelIdx);
        } else {
          if (patternToggle % 2 === 0) {
            squares = chunk.slice(0, 4);
            tall = chunk[4];
          } else {
            tall = chunk[0];
            squares = chunk.slice(1, 5);
          }
        }

        if (patternToggle % 2 === 0) {
          sections.push({ type: "patternA", squares, tall });
        } else {
          sections.push({ type: "patternB", tall, squares });
        }

        cursor += 5;
        patternToggle++;
      } else {
        // Group remaining items into rows of 3 squares
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

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* 1. Dedicated Search Launcher (Navigates to /search route, NO in-page state display) */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.searchBarBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          activeOpacity={0.82}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={17} color={colors.textSecondary} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search creators, places, tags...</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Interactive Horizontal Category Channel Pills */}
      <View style={[styles.categoriesSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
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
                style={[
                  styles.categoryPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && {
                    backgroundColor: isDark ? colors.surfaceHighlight : "#0F172A",
                    borderColor: isDark ? colors.primary : "#0F172A",
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? (isDark ? colors.primary : "#FFFFFF") : colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: colors.textSecondary },
                    isActive && {
                      color: isDark ? colors.textPrimary : "#FFFFFF",
                      fontFamily: FontFamily.bold,
                    },
                  ]}
                >
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
        contentContainerStyle={[styles.gridScrollContent, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {gridSections.map((section, secIndex) => {
          if (section.type === "patternA") {
            return (
              <View key={`sec-${secIndex}`} style={styles.staggeredRow}>
                {/* Left 2x2 Squares */}
                <View style={styles.squares2x2Grid}>
                  <View style={styles.squaresRow}>
                    {renderTile(section.squares[0], SQUARE_SIZE, SQUARE_SIZE)}
                    {renderTile(section.squares[1], SQUARE_SIZE, SQUARE_SIZE)}
                  </View>
                  <View style={styles.squaresRow}>
                    {renderTile(section.squares[2], SQUARE_SIZE, SQUARE_SIZE)}
                    {renderTile(section.squares[3], SQUARE_SIZE, SQUARE_SIZE)}
                  </View>
                </View>

                {/* Right Tall Reel/Video */}
                {renderTile(section.tall, SQUARE_SIZE, TALL_HEIGHT, true)}
              </View>
            );
          }

          if (section.type === "patternB") {
            return (
              <View key={`sec-${secIndex}`} style={styles.staggeredRow}>
                {/* Left Tall Reel/Video */}
                {renderTile(section.tall, SQUARE_SIZE, TALL_HEIGHT, true)}

                {/* Right 2x2 Squares */}
                <View style={styles.squares2x2Grid}>
                  <View style={styles.squaresRow}>
                    {renderTile(section.squares[0], SQUARE_SIZE, SQUARE_SIZE)}
                    {renderTile(section.squares[1], SQUARE_SIZE, SQUARE_SIZE)}
                  </View>
                  <View style={styles.squaresRow}>
                    {renderTile(section.squares[2], SQUARE_SIZE, SQUARE_SIZE)}
                    {renderTile(section.squares[3], SQUARE_SIZE, SQUARE_SIZE)}
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
                  {renderTile(item, SQUARE_SIZE, SQUARE_SIZE)}
                </React.Fragment>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 4. Android / Fallback: Instagram Style Animated Peek & Pop Quick Preview (Long Press) */}
      {previewPost && Platform.OS !== "ios" && (
        <Animated.View
          style={[
            styles.peekOverlay,
            {
              opacity: backdropAnim,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Dark Background Overlay with Tap to Dismiss anywhere on screen */}
          <TouchableOpacity
            style={styles.peekBackdrop}
            activeOpacity={1}
            onPress={() => closePreview()}
          />

          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.peekCardContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* 1. Floating Post Card (Slim header + Pure media) */}
            <TouchableOpacity
              activeOpacity={0.96}
              onPress={() =>
                closePreview(() => handlePostPress(previewPost))
              }
              style={[styles.peekCard, { backgroundColor: colors.surface }]}
            >
              {/* Slim Author Header */}
              <View style={[styles.peekHeader, { backgroundColor: colors.surface }]}>
                <Image
                  source={previewPost.author.avatar}
                  style={styles.peekAvatar}
                />
                <Text style={[styles.peekUsername, { color: colors.textPrimary }]} numberOfLines={1}>
                  {previewPost.author.username}
                </Text>
              </View>

              {/* Clean Media (No overlays) */}
              <View style={styles.peekMediaWrapper}>
                <Image
                  source={previewPost.image}
                  style={styles.peekImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>

            {/* 2. Floating Context Menu Row: Menu on Left + Dismissable empty space on Right */}
            <View style={styles.menuRowContainer} pointerEvents="box-none">
              <View style={[
                styles.instagramContextMenu,
                { backgroundColor: isDark ? "rgba(30, 41, 59, 0.96)" : "rgba(255, 255, 255, 0.94)" }
              ]}>
                {/* Like */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => toggleLike(previewPost.id)}
                >
                  <Ionicons
                    name={
                      likedPosts[previewPost.id] ? "heart" : "heart-outline"
                    }
                    size={22}
                    color={
                      likedPosts[previewPost.id] ? "#ED4956" : colors.textPrimary
                    }
                  />
                  <Text
                    style={[
                      styles.contextMenuLabel,
                      { color: colors.textPrimary },
                      likedPosts[previewPost.id] && {
                        color: "#ED4956",
                        fontFamily: FontFamily.semiBold,
                      },
                    ]}
                  >
                    {likedPosts[previewPost.id] ? "Liked" : "Like"}
                  </Text>
                </TouchableOpacity>

                {/* Repost */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="repeat-outline" size={22} color={colors.textPrimary} />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Repost</Text>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => {
                    const authorUser = previewPost.author.username;
                    const chatId = USERNAME_TO_CHAT[authorUser] || "c1";
                    closePreview(() =>
                      router.push({
                        pathname: "/chat/[id]",
                        params: { id: chatId },
                      })
                    );
                  }}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={21}
                    color={colors.textPrimary}
                  />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Share</Text>
                </TouchableOpacity>

                {/* View Profile */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() =>
                    closePreview(() => handleAuthorPress(previewPost.author))
                  }
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color={colors.textPrimary}
                  />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>View Profile</Text>
                </TouchableOpacity>

                {/* Not interested */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons name="eye-off-outline" size={21} color={colors.textPrimary} />
                  <Text style={[styles.contextMenuLabel, { color: colors.textPrimary }]}>Not interested</Text>
                </TouchableOpacity>

                {/* Report */}
                <TouchableOpacity
                  style={styles.contextMenuItem}
                  activeOpacity={0.65}
                  onPress={() => closePreview()}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color="#ED4956"
                  />
                  <Text style={[styles.contextMenuLabel, { color: "#ED4956" }]}>
                    Report
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tapping to the side of the options closes the popup */}
              <TouchableOpacity
                style={styles.menuSideDismiss}
                activeOpacity={1}
                onPress={() => closePreview()}
              />
            </View>
          </Animated.View>
        </Animated.View>
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
  isTall: boolean = false,
  isLiked: boolean = false,
  onNativeAction?: (actionId: string, post: ExplorePost) => void
) {
  const isVideo = isTall || post.type === "reel";
  const viewsOrLikes = isVideo
    ? `▶ ${(post.likes * 2.5).toLocaleString()}`
    : `❤️ ${post.likes >= 1000 ? (post.likes / 1000).toFixed(1) + "k" : post.likes}`;

  const tileContent = (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(post)}
      onLongPress={Platform.OS === "ios" ? undefined : () => onLongPress(post)}
      delayLongPress={180}
      style={[styles.tile, { width, height }]}
    >
      <Image
        source={post.image}
        style={{ width, height }}
        resizeMode="cover"
      />

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

  // Method 1 (iOS Native): Native UIContextMenu with system haptics, spring lift, and SF Symbols menu
  if (Platform.OS === "ios" && onNativeAction) {
    return (
      <MenuView
        key={post.id}
        shouldOpenOnLongPress={true}
        actions={[
          {
            id: "like",
            title: isLiked ? "Unlike" : "Like",
            image: isLiked ? "heart.fill" : "heart",
          },
          {
            id: "repost",
            title: "Repost",
            image: "arrow.2.squarepath",
          },
          {
            id: "share",
            title: "Share",
            image: "paperplane",
          },
          {
            id: "view_profile",
            title: "View Profile",
            image: "person.crop.circle",
          },
          {
            id: "not_interested",
            title: "Not interested",
            image: "eye.slash",
          },
          {
            id: "report",
            title: "Report",
            image: "exclamationmark.bubble",
            attributes: {
              destructive: true,
            },
          },
        ]}
        onPressAction={({ nativeEvent }) => {
          onNativeAction(nativeEvent.event, post);
        }}
        style={{ width, height }}
      >
        {tileContent}
      </MenuView>
    );
  }

  // Method 2 (Android / Fallback): Custom React Native touchable with custom peek overlay
  return (
    <React.Fragment key={post.id}>
      {tileContent}
    </React.Fragment>
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
  // Instagram Peek & Pop Overlay
  peekOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
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
  peekCardContainer: {
    width: "100%",
    maxWidth: 340,
    alignItems: "flex-start",
  },
  peekCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 22,
  },
  peekHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  peekAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
  },
  peekUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: "#0F172A",
  },
  peekMediaWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000000",
  },
  peekImage: {
    width: "100%",
    height: "100%",
  },
  // Instagram Floating Vertical Context Menu (below card, left aligned)
  menuRowContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
  },
  instagramContextMenu: {
    width: 235,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 22,
    paddingVertical: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
  },
  menuSideDismiss: {
    flex: 1,
    alignSelf: "stretch",
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 13,
  },
  contextMenuLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: "#0F172A",
  },
});
