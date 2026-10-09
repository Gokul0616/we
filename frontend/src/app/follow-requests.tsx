import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, FontFamily } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "../components/common/AppText";
import { AppButton } from "../components/common/AppButton";
import { useNotifications, FollowRequestItem } from "../context/NotificationContext";
import { resolveAvatarSource } from "../utils/mediaHelper";

export default function FollowRequestsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { followRequests, acceptFollowRequest, rejectFollowRequest } = useNotifications();

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Follow Requests</AppText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {followRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
            <AppText weight="bold" style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No follow requests</AppText>
            <AppText style={[styles.emptyStateDesc, { color: colors.textSecondary }]}>
              When people ask to follow you, {"you'll"} see their requests here.
            </AppText>
          </View>
        ) : (
          followRequests.map((req: FollowRequestItem) => (
            <View key={req.id} style={styles.requestRow}>
              {/* User Avatar */}
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/user-profile",
                    params: { username: req.follower_username },
                  });
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={resolveAvatarSource(req.actor_avatar)}
                  style={styles.userAvatar}
                />
              </TouchableOpacity>

              {/* User Info */}
              <View style={styles.userInfo}>
                <AppText weight="bold" style={[styles.usernameText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {req.follower_username}
                </AppText>
                <AppText style={[styles.fullNameText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {req.actor_fullName || req.follower_username}
                </AppText>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <AppButton
                  title="Confirm"
                  variant="primary"
                  size="sm"
                  onPress={() => acceptFollowRequest(req.follower_id)}
                />

                <AppButton
                  title="Delete"
                  variant="secondary"
                  size="sm"
                  onPress={() => rejectFollowRequest(req.follower_id)}
                />
              </View>
            </View>
          ))
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: "#0F172A",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 10,
  },
  usernameText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    marginBottom: 2,
  },
  fullNameText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: "#FFFFFF",
  },
  deleteBtn: {
    borderWidth: 1,
  },
  deleteBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
});
