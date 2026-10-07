import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../constants/theme";
import { EXPLORE_POSTS, ExplorePost } from "../screens/explore/ExploreScreen";

const IMG_AVATAR = require("../../assets/images/profile_avatar.jpg");

interface RecentSearchItem {
  id: string;
  type: "account" | "tag";
  title: string;
  subtitle: string;
  avatar?: any;
  isMe?: boolean;
}

const INITIAL_RECENT: RecentSearchItem[] = [
  { id: "s1", type: "account", title: "my_profile", subtitle: "My Profile (You)", avatar: IMG_AVATAR, isMe: true },
  { id: "s2", type: "tag", title: "#cinqueterre", subtitle: "2.4M posts" },
  { id: "s3", type: "tag", title: "#santorini", subtitle: "5.1M posts" },
  { id: "s4", type: "account", title: "elena_travels", subtitle: "Elena Rossi", isMe: false },
  { id: "s5", type: "tag", title: "#photography", subtitle: "8.7M posts" },
  { id: "s6", type: "account", title: "alex_wanderer", subtitle: "Alex Rivera", isMe: false },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentList, setRecentList] = useState<RecentSearchItem[]>(INITIAL_RECENT);

  const handleAuthorPress = (author: { username: string; fullName?: string; isMe?: boolean }) => {
    if (author.isMe) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/user-profile",
        params: {
          username: author.username,
          name: author.fullName || author.username,
        },
      });
    }
  };

  const handlePostPress = (post: ExplorePost) => {
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  };

  const handleRemoveRecent = (id: string) => {
    setRecentList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setRecentList([]);
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return EXPLORE_POSTS.filter(
      (p) =>
        p.author.username.toLowerCase().includes(q) ||
        p.author.fullName.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header with Search Input & Back */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Keyboard.dismiss();
            router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creators, places, tags..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
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

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.trim().length > 0 ? (
          /* Search Results */
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeading}>
              {filteredPosts.length} Results for "{searchQuery}"
            </Text>

            {filteredPosts.length === 0 ? (
              <View style={styles.noResultsWrap}>
                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSub}>
                  Try searching for people, travel, food, or #photography
                </Text>
              </View>
            ) : (
              filteredPosts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.resultRow}
                  activeOpacity={0.7}
                  onPress={() => handlePostPress(p)}
                >
                  <TouchableOpacity
                    onPress={() => handleAuthorPress(p.author)}
                    style={styles.resultAvatarWrap}
                  >
                    <Image source={p.author.avatar} style={styles.resultAvatar} />
                  </TouchableOpacity>

                  <View style={styles.resultInfo}>
                    <TouchableOpacity onPress={() => handleAuthorPress(p.author)}>
                      <Text style={styles.resultUsername}>
                        {p.author.username} {p.author.isMe && "• (You)"}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.resultCaption} numberOfLines={1}>
                      {p.caption}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {p.category} · {p.likes.toLocaleString()} likes
                    </Text>
                  </View>

                  <Image source={p.image} style={styles.resultThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Recent Searches */
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              {recentList.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentList.length === 0 ? (
              <Text style={styles.emptyRecentText}>No recent searches</Text>
            ) : (
              recentList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentRow}
                  activeOpacity={0.7}
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
                    <Text style={styles.recentItemTitle}>
                      {item.title} {item.isMe && "• (You)"}
                    </Text>
                    <Text style={styles.recentItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  searchBar: {
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
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14.5,
    color: "#0F172A",
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  resultsContainer: {
    paddingVertical: 14,
  },
  resultsHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
  },
  resultAvatarWrap: {
    marginRight: 12,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: "#0F172A",
  },
  resultCaption: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: "#475569",
  },
  resultMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  resultThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginLeft: 10,
  },
  noResultsWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  noResultsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: "#0F172A",
  },
  noResultsSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  recentSection: {
    paddingVertical: 8,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  recentTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: "#0F172A",
  },
  clearAllText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  emptyRecentText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#94A3B8",
    paddingVertical: 16,
    textAlign: "center",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
});
