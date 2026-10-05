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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Local image references
const IMG_AVATAR = require("../../../assets/images/profile_gokul_avatar.jpg");

export interface ChatThread {
  id: string;
  user: {
    username: string;
    fullName: string;
    avatar: any;
    isOnline: boolean;
  };
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
}

export interface NoteItem {
  id: string;
  user: {
    username: string;
    avatar: any;
    isOnline: boolean;
  };
  noteText: string;
  isSelf?: boolean;
}

export interface MessageBubble {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

export const NOTES_DATA: NoteItem[] = [
  {
    id: "self",
    user: {
      username: "Your note",
      avatar: IMG_AVATAR,
      isOnline: true,
    },
    noteText: "Share a thought...",
    isSelf: true,
  },
  {
    id: "n1",
    user: {
      username: "sarah.j",
      avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
      isOnline: true,
    },
    noteText: "Coffee time ☕",
  },
  {
    id: "n2",
    user: {
      username: "alex.c",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
      isOnline: true,
    },
    noteText: "Editing shots 📸",
  },
  {
    id: "n3",
    user: {
      username: "priya.s",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
      isOnline: false,
    },
    noteText: "New pasta recipe 🍝",
  },
  {
    id: "n4",
    user: {
      username: "daniel.k",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      isOnline: true,
    },
    noteText: "Gym session 💪",
  },
];

export const CHATS_DATA: ChatThread[] = [
  {
    id: "c1",
    user: {
      username: "sarah.j",
      fullName: "Sarah Johnson",
      avatar: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80" },
      isOnline: true,
    },
    lastMessage: "Haha that's amazing! See you tomorrow 🙌",
    timeAgo: "2m",
    unreadCount: 2,
  },
  {
    id: "c2",
    user: {
      username: "alex.c",
      fullName: "Alex Carter",
      avatar: { uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" },
      isOnline: true,
    },
    lastMessage: "Sent you the raw files from the mountain hike.",
    timeAgo: "15m",
    unreadCount: 0,
  },
  {
    id: "c3",
    user: {
      username: "priya.s",
      fullName: "Priya Sharma",
      avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
      isOnline: false,
    },
    lastMessage: "You: That restaurant in Rome looks unreal!",
    timeAgo: "1h",
    unreadCount: 0,
  },
  {
    id: "c4",
    user: {
      username: "daniel.k",
      fullName: "Daniel Kim",
      avatar: { uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80" },
      isOnline: true,
    },
    lastMessage: "Are you coming to the meet-up this weekend?",
    timeAgo: "3h",
    unreadCount: 1,
  },
  {
    id: "c5",
    user: {
      username: "elena_travels",
      fullName: "Elena Rossi",
      avatar: { uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&q=80" },
      isOnline: false,
    },
    lastMessage: "You: Enjoy Greece! Take lots of photos 🌊",
    timeAgo: "1d",
    unreadCount: 0,
  },
  {
    id: "c6",
    user: {
      username: "chef_marco",
      fullName: "Marco Bellini",
      avatar: { uri: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80" },
      isOnline: false,
    },
    lastMessage: "The secret is slow-simmering the pomodoro sauce.",
    timeAgo: "2d",
    unreadCount: 0,
  },
];

export function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"primary" | "general" | "requests">("primary");

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return CHATS_DATA;
    const q = searchQuery.toLowerCase().trim();
    return CHATS_DATA.filter(
      (c) =>
        c.user.username.toLowerCase().includes(q) ||
        c.user.fullName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Instagram Direct Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerUsername}>we.messages</Text>
          <Ionicons name="chevron-down" size={14} color="#0F172A" style={{ marginLeft: 4 }} />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="videocam-outline" size={25} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="create-outline" size={23} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* 2. Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Notes & Active Friends Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.notesCarousel}
        >
          {NOTES_DATA.map((note) => (
            <TouchableOpacity key={note.id} style={styles.noteItem} activeOpacity={0.8}>
              {/* Floating Note Thought Bubble */}
              <View style={[styles.noteBubble, note.isSelf && styles.noteBubbleSelf]}>
                <Text style={styles.noteBubbleText} numberOfLines={1}>
                  {note.noteText}
                </Text>
                <View style={styles.noteBubbleTail} />
              </View>

              {/* Avatar with Online Badge */}
              <View style={styles.noteAvatarWrapper}>
                <Image source={note.user.avatar} style={styles.noteAvatar} />
                {note.isSelf ? (
                  <View style={styles.addNoteBadge}>
                    <Ionicons name="add" size={13} color="#FFFFFF" />
                  </View>
                ) : note.user.isOnline ? (
                  <View style={styles.onlineBadge} />
                ) : null}
              </View>

              <Text style={styles.noteUsername} numberOfLines={1}>
                {note.user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 4. Tab Selector (Primary / General / Requests) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "primary" && styles.tabBtnActive]}
            onPress={() => setActiveTab("primary")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "primary" && styles.tabBtnTextActive,
              ]}
            >
              Primary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "general" && styles.tabBtnActive]}
            onPress={() => setActiveTab("general")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "general" && styles.tabBtnTextActive,
              ]}
            >
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "requests" && styles.tabBtnActive]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "requests" && styles.tabBtnTextActive,
              ]}
            >
              Requests (1)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Chat Threads List */}
        <View style={styles.chatList}>
          {filteredChats.map((chat) => {
            const hasUnread = chat.unreadCount > 0;
            return (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatRow}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[id]",
                    params: { id: chat.id },
                  })
                }
              >
                {/* Avatar with Online indicator */}
                <View style={styles.chatAvatarContainer}>
                  <Image source={chat.user.avatar} style={styles.chatAvatar} />
                  {chat.user.isOnline && <View style={styles.chatOnlineBadge} />}
                </View>

                {/* Metadata */}
                <View style={styles.chatMeta}>
                  <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]}>
                    {chat.user.fullName}
                  </Text>
                  <Text
                    style={[styles.chatPreview, hasUnread && styles.chatPreviewUnread]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage} · {chat.timeAgo}
                  </Text>
                </View>

                {/* Trailing indicator: Camera icon or Unread Blue Dot */}
                <View style={styles.chatTrailing}>
                  {hasUnread ? (
                    <View style={styles.unreadDot} />
                  ) : (
                    <TouchableOpacity style={{ padding: 4 }}>
                      <Ionicons name="camera-outline" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUsername: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconBtn: {
    padding: 2,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  searchBar: {
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
    fontSize: 14.5,
    color: "#0F172A",
    paddingVertical: 0,
  },
  notesCarousel: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  noteItem: {
    alignItems: "center",
    width: 72,
  },
  noteBubble: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
    maxWidth: 82,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  noteBubbleSelf: {
    backgroundColor: "#F8FAFC",
  },
  noteBubbleText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: "#334155",
    textAlign: "center",
  },
  noteBubbleTail: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: "#F1F5F9",
    transform: [{ rotate: "45deg" }],
  },
  noteAvatarWrapper: {
    position: "relative",
  },
  noteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E2E8F0",
  },
  addNoteBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  noteUsername: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    marginBottom: 6,
  },
  tabBtn: {
    paddingVertical: 10,
    marginRight: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#0F172A",
  },
  tabBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: "#8E8E93",
  },
  tabBtnTextActive: {
    color: "#0F172A",
    fontFamily: FontFamily.bold,
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  chatAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  chatOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatMeta: {
    flex: 1,
  },
  chatName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14.5,
    color: "#0F172A",
    marginBottom: 2,
  },
  chatNameUnread: {
    fontFamily: FontFamily.bold,
  },
  chatPreview: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: "#8E8E93",
  },
  chatPreviewUnread: {
    fontFamily: FontFamily.semiBold,
    color: "#0F172A",
  },
  chatTrailing: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
