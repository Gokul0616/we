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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, FontFamily } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import {
  CHATS_DATA,
  ChatThread,
  MessageBubble,
} from "../../screens/messages/MessagesScreen";

const INITIAL_MESSAGES: Record<string, MessageBubble[]> = {
  c1: [
    { id: "m1", sender: "them", text: "Hey! Did you check out the new travel photos?", time: "10:30 AM" },
    { id: "m2", sender: "me", text: "Yes! The Cinque Terre coast looks breathtaking 😍", time: "10:32 AM" },
    { id: "m3", sender: "them", text: "Haha that's amazing! See you tomorrow 🙌", time: "10:35 AM" },
  ],
  c2: [
    { id: "m1", sender: "them", text: "Hey there! Here are the photos from yesterday.", time: "9:00 AM" },
    { id: "m2", sender: "them", text: "Sent you the raw files from the mountain hike.", time: "9:05 AM" },
  ],
  c3: [
    { id: "m1", sender: "them", text: "Have you tried that new Italian restaurant downtown?", time: "Yesterday" },
    { id: "m2", sender: "me", text: "That restaurant in Rome looks unreal!", time: "1h ago" },
  ],
  c4: [
    { id: "m1", sender: "them", text: "Are you coming to the meet-up this weekend?", time: "3h ago" },
  ],
  c5: [
    { id: "m1", sender: "them", text: "Arrived in Santorini! The views are surreal 🌊", time: "1d ago" },
    { id: "m2", sender: "me", text: "Enjoy Greece! Take lots of photos 🌊", time: "1d ago" },
  ],
  c6: [
    { id: "m1", sender: "them", text: "The secret is slow-simmering the pomodoro sauce.", time: "2d ago" },
  ],
};

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find the active chat thread
  const chatThread = useMemo<ChatThread>(() => {
    const found = CHATS_DATA.find((c) => c.id === id);
    if (found) return found;
    return {
      id: id || "unknown",
      user: {
        username: "user",
        fullName: "Chat",
        avatar: { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&q=80" },
        isOnline: true,
      },
      lastMessage: "",
      timeAgo: "now",
      unreadCount: 0,
    };
  }, [id]);

  const [messages, setMessages] = useState<MessageBubble[]>(
    INITIAL_MESSAGES[id || "c1"] || [
      { id: "m1", sender: "them", text: `Hey! Thanks for connecting.`, time: "Just now" },
    ]
  );
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: MessageBubble = {
      id: `msg_${Date.now()}`,
      sender: "me",
      text: inputText.trim(),
      time: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  const handleSendHeart = () => {
    const newMsg: MessageBubble = {
      id: `msg_${Date.now()}`,
      sender: "me",
      text: "❤️",
      time: "Just now",
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUserSection}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <View style={styles.avatarWrapper}>
            <Image source={chatThread.user.avatar} style={styles.headerAvatar} />
            {chatThread.user.isOnline && (
              <View style={[styles.headerOnlineBadge, { borderColor: colors.background }]} />
            )}
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={[styles.headerUserName, { color: colors.textPrimary }]}>{chatThread.user.fullName}</Text>
            <Text style={styles.headerUserStatus}>
              {chatThread.user.isOnline ? "Active now" : "Active recently"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="call-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        style={[styles.messagesContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instagram Profile Header in DM */}
        <View style={[styles.chatIntro, { borderBottomColor: colors.border }]}>
          <Image source={chatThread.user.avatar} style={styles.chatIntroAvatar} />
          <Text style={[styles.chatIntroName, { color: colors.textPrimary }]}>{chatThread.user.fullName}</Text>
          <Text style={[styles.chatIntroHandle, { color: colors.textSecondary }]}>@{chatThread.user.username}</Text>
          <Text style={[styles.chatIntroSub, { color: colors.textMuted }]}>We · 2.4k followers · 18 posts</Text>
          <TouchableOpacity
            style={[styles.viewProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={[styles.viewProfileBtnText, { color: colors.textPrimary }]}>View profile</Text>
          </TouchableOpacity>
        </View>

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isMe = msg.sender === "me";
          const isHeart = msg.text === "❤️";

          return (
            <View
              key={msg.id}
              style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
            >
              {!isMe && (
                <Image source={chatThread.user.avatar} style={styles.bubbleAvatar} />
              )}
              {isHeart ? (
                <Text style={styles.heartEmoji}>❤️</Text>
              ) : (
                <View
                  style={[
                    styles.bubble,
                    isMe
                      ? styles.bubbleMe
                      : [styles.bubbleThem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.bubbleTextMe : [styles.bubbleTextThem, { color: colors.textPrimary }],
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Input Composer Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.composerContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.camBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />

            {inputText.trim().length > 0 ? (
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.inputRightIcons}>
                <TouchableOpacity style={styles.iconHit}>
                  <Ionicons name="mic-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconHit}>
                  <Ionicons name="image-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconHit} onPress={handleSendHeart}>
                  <Ionicons name="heart-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerUserSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrapper: {
    position: "relative",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerUserInfo: {
    justifyContent: "center",
  },
  headerUserName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: "#0F172A",
  },
  headerUserStatus: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#10B981",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerActionBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  chatIntro: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8,
  },
  chatIntroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
  },
  chatIntroName: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: "#0F172A",
  },
  chatIntroHandle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  chatIntroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  viewProfileBtn: {
    marginTop: 12,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewProfileBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: "#0F172A",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowThem: {
    justifyContent: "flex-start",
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#EFEFEF",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: "#FFFFFF",
  },
  bubbleTextThem: {
    color: "#0F172A",
  },
  heartEmoji: {
    fontSize: 38,
    marginVertical: 4,
  },
  composerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  camBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 6,
  },
  sendBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  sendBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.primary,
  },
  inputRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconHit: {
    padding: 3,
  },
});
