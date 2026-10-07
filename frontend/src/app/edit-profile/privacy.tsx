import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
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

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState({
    visibility: "public" as "public" | "friends" | "private",
    show_activity_status: true,
    allow_direct_messages: true,
    who_can_tag: "everyone" as "everyone" | "friends" | "no_one",
  });

  useEffect(() => {
    const applyUser = (u: any) => {
      if (u?.privacy_settings) {
        setPrivacy((prev) => ({
          ...prev,
          ...u.privacy_settings,
        }));
      }
    };

    authStorage.getUser().then(applyUser);
    const unsubscribe = userService.subscribe(applyUser);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        privacy_settings: privacy,
      });
      setSaving(false);
      toast.success("Privacy settings updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save privacy settings error:", e);
      Alert.alert("Error", "Failed to update privacy settings.");
    }
  };

  const getVisibilityLabel = () => {
    return privacy.visibility.charAt(0).toUpperCase() + privacy.visibility.slice(1);
  };

  const getTaggingLabel = () => {
    if (privacy.who_can_tag === "everyone") return "Everyone";
    if (privacy.who_can_tag === "friends") return "Friends";
    return "No One";
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Settings</Text>
        <TouchableOpacity style={styles.headerSaveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerSaveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Visibility Navigation Option */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Profile Visibility</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile/visibility" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "#EFF6FF" }]}>
              <Ionicons name="eye-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.navCol}>
              <Text style={[styles.menuRowTitle, { color: colors.textPrimary }]}>Profile Visibility</Text>
              <Text style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>
                Currently set to {getVisibilityLabel()}
              </Text>
            </View>
            <Text style={[styles.currentValueBadge, { color: colors.primary }]}>{getVisibilityLabel()}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Messaging & Activity Toggles */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Activity & Messages</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowTitle, { color: colors.textPrimary }]}>Show Activity Status</Text>
              <Text style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>Let others know when you're online or active</Text>
            </View>
            <Switch
              value={privacy.show_activity_status}
              onValueChange={(val) => {
                const next = { ...privacy, show_activity_status: val };
                setPrivacy(next);
                userService.updateProfile({ privacy_settings: next });
              }}
              trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowTitle, { color: colors.textPrimary }]}>Allow Direct Messages</Text>
              <Text style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>Receive direct messages from anyone</Text>
            </View>
            <Switch
              value={privacy.allow_direct_messages}
              onValueChange={(val) => {
                const next = { ...privacy, allow_direct_messages: val };
                setPrivacy(next);
                userService.updateProfile({ privacy_settings: next });
              }}
              trackColor={{ false: isDark ? "#334155" : "#CBD5E1", true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Mentions & Tagging Navigation Option */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Mentions & Tags</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.navRow}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile/tagging" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(22, 163, 74, 0.2)" : "#F0FDF4" }]}>
              <Ionicons name="pricetag-outline" size={18} color="#16A34A" />
            </View>
            <View style={styles.navCol}>
              <Text style={[styles.menuRowTitle, { color: colors.textPrimary }]}>Who can tag you</Text>
              <Text style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>
                Control mentions in posts, reels, and stories
              </Text>
            </View>
            <Text style={[styles.currentValueBadge, { color: colors.primary }]}>{getTaggingLabel()}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
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
  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  navCol: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  menuRowSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  currentValueBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
    marginRight: 6,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 6,
  },
});
