import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { SettingsHeader, SettingsSection } from "../../components/settings/SettingsUI";

export default function BlockedUsersScreen() {
  const { colors, isDark } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.blocked_users) {
        setBlockedUsers(user.blocked_users);
      }
    });
  }, []);

  const handleUnblock = async (username: string) => {
    try {
      await userService.unblockUser(username);
      setBlockedUsers((prev) => prev.filter((u) => u !== username));
      toast.info(`Unblocked @${username}`);
    } catch (_) {
      toast.error(`Failed to unblock @${username}`);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Blocked Users" />

      {blockedUsers.length === 0 ? (
        <View style={styles.container}>
          {/* Empty state illustration */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? "#18181B" : "#EFF6FF" },
            ]}
          >
            <Ionicons name="person-outline" size={42} color="#2563EB" />
            <View
              style={[
                styles.slashBadge,
                { backgroundColor: colors.background, borderColor: isDark ? "#18181B" : "#EFF6FF" },
              ]}
            >
              <Ionicons name="close" size={16} color="#EF4444" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            No blocked users yet
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            When you block someone, they won't be able to see your profile or
            interact with you.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SettingsSection title="Blocked Accounts">
            {blockedUsers.map((username, index) => (
              <View key={username} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle-outline" size={32} color={colors.textSecondary} />
                  <Text style={[styles.usernameText, { color: colors.textPrimary }]}>@{username}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.unblockBtn, { borderColor: colors.border }]}
                  onPress={() => handleUnblock(username)}
                >
                  <Text style={[styles.unblockText, { color: colors.textPrimary }]}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </SettingsSection>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: -40,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  slashBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  usernameText: {
    fontSize: 15,
    fontWeight: "600",
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
