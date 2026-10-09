import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userService } from "../../services/userService";
import { authStorage } from "../../services/authStorage";
import { toast } from "../../services/toastService";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

type VisibilityType = "public" | "friends" | "private";

interface VisibilityOption {
  type: VisibilityType;
  title: string;
  badge: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    type: "public",
    title: "Public",
    badge: "Recommended",
    description:
      "Anyone on or off WE can see your profile, posts, stories, reels, followers, and following list. Your content can appear in Explore feeds and search results.",
    icon: "globe-outline",
    color: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    type: "friends",
    title: "Friends Only",
    badge: "Close Circle",
    description:
      "Only people you have approved as friends can view your posts and personal details. People who don't follow you must send a request to see your content.",
    icon: "people-outline",
    color: "#16A34A",
    bgColor: "#F0FDF4",
  },
  {
    type: "private",
    title: "Private",
    badge: "Maximum Privacy",
    description:
      "Only you can see your profile information and posts. Your profile is hidden from search recommendations, and nobody can tag or message you without explicit approval.",
    icon: "lock-closed-outline",
    color: "#DC2626",
    bgColor: "#FEF2F2",
  },
];

export default function ProfileVisibilityScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityType>("public");
  const [fullPrivacy, setFullPrivacy] = useState<any>({});

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.privacy_settings) {
        setFullPrivacy(u.privacy_settings);
        if (u.privacy_settings.visibility) {
          setSelectedVisibility(u.privacy_settings.visibility);
        }
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updatedPrivacy = {
        ...fullPrivacy,
        visibility: selectedVisibility,
      };

      await userService.updateProfile({
        privacy_settings: updatedPrivacy,
      });

      setSaving(false);
      toast.success("Profile visibility updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save visibility error:", e);
      Alert.alert("Error", "Failed to update profile visibility.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Profile Visibility
        </AppText>
        <TouchableOpacity
          style={styles.headerSaveButton}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile visibility"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText variant="button" weight="bold" style={[styles.headerSaveText, { color: colors.primary }]}>
              Save
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AppText variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Choose who can view your profile and find you across WE. You can change this setting at any time.
        </AppText>

        {VISIBILITY_OPTIONS.map((opt) => {
          const isSelected = selectedVisibility === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.primary },
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedVisibility(opt.type)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.title} visibility option`}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : opt.bgColor },
                  ]}
                >
                  <Ionicons name={opt.icon} size={22} color={opt.color} />
                </View>
                <View style={styles.titleCol}>
                  <View style={styles.titleBadgeRow}>
                    <AppText variant="subtitle" weight="bold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      {opt.title}
                    </AppText>
                    {opt.badge && (
                      <View
                        style={[
                          styles.badgePill,
                          { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : opt.bgColor },
                        ]}
                      >
                        <AppText variant="caption" weight="bold" style={[styles.badgeText, { color: opt.color }]}>
                          {opt.badge}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: colors.border },
                    isSelected && { borderColor: colors.primary },
                  ]}
                >
                  {isSelected && <View style={[styles.radioInnerDot, { backgroundColor: colors.primary }]} />}
                </View>
              </View>

              <AppText variant="bodySmall" style={[styles.optionDesc, { color: colors.textSecondary }]}>
                {opt.description}
              </AppText>
            </TouchableOpacity>
          );
        })}

        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: isDark ? colors.surface : "#EFF6FF",
              borderColor: isDark ? colors.border : "#BFDBFE",
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <AppText variant="bodySmall" weight="medium" style={[styles.infoBannerText, { color: colors.primary }]}>
            Changes take effect immediately across all client sessions and real-time gateways.
          </AppText>
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
    fontFamily: FontFamily.bold,
    color: "#0F172A",
  },
  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerSaveText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "#2563EB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  optionCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "#0F172A",
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#2563EB",
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: "#475569",
    lineHeight: 19,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: "#1E40AF",
    lineHeight: 18,
  },
});
