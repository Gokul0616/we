import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";

export default function MessagesTab() {
  const chats = [
    {
      id: "1",
      name: "Sarah Johnson",
      message: "Haha that's so cool! • 2m",
      unread: 3,
      avatarColor: "#6366f1",
      initial: "S",
    },
    {
      id: "2",
      name: "Travel Buddies",
      message: "You: Let's plan the next trip! • 12m",
      unread: 1,
      avatarColor: "#3b82f6",
      initial: "T",
    },
    {
      id: "3",
      name: "Arjun",
      message: "Sounds good! • 1h",
      unread: 0,
      avatarColor: "#10b981",
      initial: "A",
    },
    {
      id: "4",
      name: "Priya Sharma",
      message: "On my way! • 2h",
      unread: 0,
      avatarColor: "#f59e0b",
      initial: "P",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {chats.map((chat) => (
          <TouchableOpacity key={chat.id} style={styles.chatItem}>
            <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
              <Text style={styles.avatarText}>{chat.initial}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.name}>{chat.name}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {chat.message}
              </Text>
            </View>
            {chat.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{chat.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 8,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  list: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  preview: {
    fontSize: 13,
    color: "#64748B",
  },
  badge: {
    backgroundColor: Colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
