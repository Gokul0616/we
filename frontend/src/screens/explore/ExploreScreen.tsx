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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_GAP = 2;
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

// 18 Rich Explore Posts (with "You" and other creators)
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

const FEATURED_CREATORS = [
  {
    id: "fc_me",
    username: "gokul_ssb",
    fullName: "You",
    avatar: IMG_AVATAR,
    followers: "1.2K",
    isMe: true,
  },
  {
    id: "fc1",
    username: "elena_travels",
    fullName: "Elena Rossi",
    avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
    followers: "42.8K",
    isMe: false,
  },
  {
    id: "fc2",
    username: "chef_marco",
    fullName: "Marco Bellini",
    avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
    followers: "89.1K",
    isMe: false,
  },
  {
    id: "fc3",
    username: "alex_wanderer",
    fullName: "Alex Rivera",
    avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
    followers: "128K",
    isMe: false,
  },
  {
    id: "fc4",
    username: "maya_lin",
    fullName: "Maya Lin",
    avatar: { uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&q=80" },
    followers: "65.3K",
    isMe: false,
  },
  {
    id: "fc5",
    username: "design_daily",
    fullName: "David Sterling",
    avatar: { uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80" },
    followers: "31.4K",
    isMe: false,
  },
];

const RECENT_SEARCHES = [
  { id: "s1", type: "account", title: "gokul_ssb", subtitle: "Gokul Ssb (You)", avatar: IMG_AVATAR, isMe: true },
  { id: "s2", type: "tag", title: "#cinqueterre", subtitle: "2.4M posts" },
  { id: "s3", type: "tag", title: "#santorini", subtitle: "5.1M posts" },
  { id: "s4", type: "account", title: "elena_travels", subtitle: "Elena Rossi", isMe: false },
  { id: "s5", type: "tag", title: "#photography", subtitle: "8.7M posts" },
];

export function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Filter posts based on category and search query
  const filteredPosts = useMemo(() => {
    let result = EXPLORE_POSTS;
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.author.username.toLowerCase().includes(q) ||
          p.author.fullName.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, selectedCategory]);

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

      {/* 1. Header: Search Bar */}
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
            placeholder="Search creators, places, reels"
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

      {/* 2. Interactive Horizontal Category Channel Pills */}
      {!isSearchFocused && (
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
      )}

      {/* 3. Search Mode Overlay */}
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
                  handlePostPress(p);
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsSearchFocused(false);
                    handleAuthorPress(p.author);
                  }}
                >
                  <Image source={p.author.avatar} style={styles.searchResultAvatar} />
                </TouchableOpacity>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultUsername}>
                    {p.author.username} {p.author.isMe && "• (You)"}
                  </Text>
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
                  if (item.type === "account") {
                    handleAuthorPress({
                      username: item.title,
                      fullName: item.subtitle,
                      isMe: item.isMe,
                    });
                  } else {
                    setSearchQuery(item.title.replace(/^#/, ""));
                  }
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
        /* 4. Rich Instagram Staggered Media Grid & Creator Spotlight */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridScrollContent}
        >
          {/* Creator Spotlight Carousel (Shown on 'All' or First Page) */}
          {selectedCategory === "all" && (
            <View style={styles.creatorsSection}>
              <View style={styles.creatorsHeader}>
                <View style={styles.creatorsHeaderLeft}>
                  <Ionicons name="flash" size={16} color="#F59E0B" />
                  <Text style={styles.creatorsTitle}>Trending Creators</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                  <Text style={styles.creatorsMore}>My Profile</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.creatorsTray}
              >
                {FEATURED_CREATORS.map((creator) => (
                  <TouchableOpacity
                    key={creator.id}
                    style={styles.creatorCard}
                    activeOpacity={0.8}
                    onPress={() => handleAuthorPress(creator)}
                  >
                    <LinearGradient
                      colors={
                        creator.isMe
                          ? [Colors.primary, "#8B5CF6"]
                          : ["#F58529", "#DD2A7B", "#8134AF"]
                      }
                      style={styles.creatorGradientRing}
                    >
                      <View style={styles.creatorAvatarWrap}>
                        <Image source={creator.avatar} style={styles.creatorAvatar} />
                      </View>
                    </LinearGradient>
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {creator.isMe ? "Your Profile" : creator.fullName}
                    </Text>
                    <Text style={styles.creatorHandle} numberOfLines={1}>
                      @{creator.username}
                    </Text>
                    <View
                      style={[
                        styles.creatorFollowBadge,
                        creator.isMe && styles.creatorMeBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.creatorFollowText,
                          creator.isMe && styles.creatorMeText,
                        ]}
                      >
                        {creator.isMe ? "You" : "+ Follow"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Staggered Grid Blocks */}
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
                        {squares[0] &&
                          renderRichTile(
                            squares[0],
                            SQUARE_SIZE,
                            SQUARE_SIZE,
                            handlePostPress,
                            handlePostLongPress
                          )}
                        {squares[1] &&
                          renderRichTile(
                            squares[1],
                            SQUARE_SIZE,
                            SQUARE_SIZE,
                            handlePostPress,
                            handlePostLongPress
                          )}
                      </View>
                      <View style={styles.squaresRow}>
                        {squares[2] &&
                          renderRichTile(
                            squares[2],
                            SQUARE_SIZE,
                            SQUARE_SIZE,
                            handlePostPress,
                            handlePostLongPress
                          )}
                        {squares[3] &&
                          renderRichTile(
                            squares[3],
                            SQUARE_SIZE,
                            SQUARE_SIZE,
                            handlePostPress,
                            handlePostLongPress
                          )}
                      </View>
                    </View>

                    {/* Right Tall Tile (Reel/Video) */}
                    {tallItem &&
                      renderRichTile(
                        tallItem,
                        SQUARE_SIZE,
                        TALL_HEIGHT,
                        handlePostPress,
                        handlePostLongPress,
                        true
                      )}
                  </View>

                  {/* Any remaining item in block */}
                  {remaining.length > 0 && (
                    <View style={styles.standardRow}>
                      {remaining.map((item) =>
                        renderRichTile(
                          item,
                          SQUARE_SIZE,
                          SQUARE_SIZE,
                          handlePostPress,
                          handlePostLongPress
                        )
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
                  {tallItem &&
                    renderRichTile(
                      tallItem,
                      SQUARE_SIZE,
                      TALL_HEIGHT,
                      handlePostPress,
                      handlePostLongPress,
                      true
                    )}

                  {/* Right 2x2 Square Grid */}
                  <View style={styles.squares2x2Grid}>
                    <View style={styles.squaresRow}>
                      {squares[0] &&
                        renderRichTile(
                          squares[0],
                          SQUARE_SIZE,
                          SQUARE_SIZE,
                          handlePostPress,
                          handlePostLongPress
                        )}
                      {squares[1] &&
                        renderRichTile(
                          squares[1],
                          SQUARE_SIZE,
                          SQUARE_SIZE,
                          handlePostPress,
                          handlePostLongPress
                        )}
                    </View>
                    <View style={styles.squaresRow}>
                      {squares[2] &&
                        renderRichTile(
                          squares[2],
                          SQUARE_SIZE,
                          SQUARE_SIZE,
                          handlePostPress,
                          handlePostLongPress
                        )}
                      {squares[3] &&
                        renderRichTile(
                          squares[3],
                          SQUARE_SIZE,
                          SQUARE_SIZE,
                          handlePostPress,
                          handlePostLongPress
                        )}
                    </View>
                  </View>
                </View>

                {/* Any remaining item in block */}
                {remaining.length > 0 && (
                  <View style={styles.standardRow}>
                    {remaining.map((item) =>
                      renderRichTile(
                        item,
                        SQUARE_SIZE,
                        SQUARE_SIZE,
                        handlePostPress,
                        handlePostLongPress
                      )
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 5. Instagram Style Peek & Pop Quick Preview (Long Press) */}
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
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
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
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 12,
  },
  searchBarFocused: {
    backgroundColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14.5,
    color: "#0F172A",
    paddingVertical: 0,
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
  // Creators Spotlight Carousel
  creatorsSection: {
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    marginBottom: 4,
  },
  creatorsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  creatorsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  creatorsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
  },
  creatorsMore: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.primary,
  },
  creatorsTray: {
    paddingHorizontal: 12,
    gap: 12,
  },
  creatorCard: {
    alignItems: "center",
    width: 78,
  },
  creatorGradientRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  creatorAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  creatorAvatar: {
    width: "100%",
    height: "100%",
  },
  creatorName: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: "#0F172A",
    textAlign: "center",
  },
  creatorHandle: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 4,
  },
  creatorFollowBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  creatorMeBadge: {
    backgroundColor: "#E2E8F0",
  },
  creatorFollowText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: "#FFFFFF",
  },
  creatorMeText: {
    color: "#475569",
  },
  // Grid
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
