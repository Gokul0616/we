import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userService } from "../../services/userService";
import { authStorage } from "../../services/authStorage";
import { resolveAvatarSource, resolveCoverSource } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";

export default function ProfilePreviewScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);

  useEffect(() => {
    const applyUser = (u: any) => {
      if (!u) return;
      if (u.full_name) setName(u.full_name);
      if (u.username) setUsername(u.username);
      if (u.bio !== undefined) setBio(u.bio);
      if (u.location !== undefined) setLocation(u.location);
      if (u.website !== undefined) setWebsite(u.website);
      if (u.avatar_url) setAvatarUri(u.avatar_url);
      if (u.cover_url) setCoverUri(u.cover_url);
    };

    authStorage.getUser().then(applyUser);
    userService.getProfile().then(applyUser);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile Preview</Text>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="eye-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Cover */}
          <Image source={resolveCoverSource(coverUri)} style={styles.previewCover} resizeMode="cover" />

          {/* Avatar */}
          <View style={[styles.previewAvatarWrapper, { borderColor: colors.surface, backgroundColor: colors.surface }]}>
            <Image source={resolveAvatarSource(avatarUri)} style={styles.previewAvatar} />
            <View style={[styles.previewAvatarBadge, { borderColor: colors.surface, backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* User Details */}
          <View style={styles.previewContent}>
            <View style={styles.previewNameRow}>
              <Text style={[styles.previewName, { color: colors.textPrimary }]}>{name}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
            <Text style={[styles.previewUsername, { color: colors.textSecondary }]}>@{username.replace(/^@/, "")}</Text>
            <Text style={[styles.previewBio, { color: colors.textPrimary }]}>{bio}</Text>

            {/* Stats Row */}
            <View
              style={[
                styles.previewStatsRow,
                { backgroundColor: isDark ? colors.surfaceHighlight : "#F8FAFC" },
              ]}
            >
              <View style={styles.previewStatCol}>
                <Text style={[styles.previewStatNum, { color: colors.textPrimary }]}>248</Text>
                <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>Posts</Text>
              </View>
              <View style={styles.previewStatCol}>
                <Text style={[styles.previewStatNum, { color: colors.textPrimary }]}>1.2K</Text>
                <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>Followers</Text>
              </View>
              <View style={styles.previewStatCol}>
                <Text style={[styles.previewStatNum, { color: colors.textPrimary }]}>312</Text>
                <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>Following</Text>
              </View>
            </View>

            {/* Location & Website rows */}
            {location ? (
              <View style={styles.previewMetaRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.previewMetaText, { color: colors.textSecondary }]}>{location}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
              </View>
            ) : null}

            {website ? (
              <View style={styles.previewMetaRow}>
                <Ionicons name="link-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.previewMetaText, { color: colors.textSecondary }]}>{website}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
              </View>
            ) : null}

            {/* Social Icons row */}
            <View style={styles.previewSocialIconsRow}>
              <View style={[styles.previewSocialIcon, { backgroundColor: "#E1306C18" }]}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
              </View>
              <View style={[styles.previewSocialIcon, { backgroundColor: isDark ? "#FFFFFF18" : "#0F172A18" }]}>
                <Ionicons name="logo-twitter" size={16} color={colors.textPrimary} />
              </View>
              <View style={[styles.previewSocialIcon, { backgroundColor: "#FF000018" }]}>
                <Ionicons name="logo-youtube" size={16} color="#FF0000" />
              </View>
              <View style={[styles.previewSocialIcon, { backgroundColor: "#0A66C218" }]}>
                <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
              </View>
              <View style={[styles.previewSocialIcon, { backgroundColor: isDark ? "#FFFFFF18" : "#24292E18" }]}>
                <Ionicons name="logo-github" size={16} color={colors.textPrimary} />
              </View>
            </View>

            {/* Edit Profile Return Button */}
            <TouchableOpacity
              style={[styles.previewEditBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Text style={styles.previewEditBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  previewCover: {
    width: "100%",
    height: 140,
  },
  previewAvatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
    position: "relative",
    marginTop: -38,
    marginLeft: 18,
  },
  previewAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },
  previewAvatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#0F172A",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  previewContent: {
    padding: 18,
  },
  previewNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  previewUsername: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 8,
  },
  previewBio: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 16,
  },
  previewStatsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    marginBottom: 16,
  },
  previewStatCol: {
    alignItems: "center",
  },
  previewStatNum: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  previewStatLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  previewMetaText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  previewSocialIconsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 18,
  },
  previewSocialIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEditBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEditBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
