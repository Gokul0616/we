import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

export default function SocialAccountsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    instagram: "",
    twitter: "",
    youtube: "",
    linkedin: "",
    facebook: "",
    github: "",
  });

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.social_links) {
        setSocialLinks((prev) => ({
          ...prev,
          ...u.social_links,
        }));
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        social_links: socialLinks,
      });
      setSaving(false);
      toast.success("Social accounts updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save social links error:", e);
      Alert.alert("Error", "Failed to update social accounts.");
    }
  };

  const platforms = [
    {
      key: "instagram",
      name: "Instagram",
      icon: "logo-instagram",
      color: "#E1306C",
      val: socialLinks.instagram,
    },
    {
      key: "twitter",
      name: "Twitter / X",
      icon: "logo-twitter",
      color: "#0F172A",
      val: socialLinks.twitter,
    },
    {
      key: "youtube",
      name: "YouTube",
      icon: "logo-youtube",
      color: "#FF0000",
      val: socialLinks.youtube,
    },
    {
      key: "linkedin",
      name: "LinkedIn",
      icon: "logo-linkedin",
      color: "#0A66C2",
      val: socialLinks.linkedin,
    },
    {
      key: "facebook",
      name: "Facebook",
      icon: "logo-facebook",
      color: "#1877F2",
      val: socialLinks.facebook,
    },
    {
      key: "github",
      name: "GitHub",
      icon: "logo-github",
      color: "#24292E",
      val: socialLinks.github,
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Social Accounts</Text>
        <TouchableOpacity style={styles.headerSaveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerSaveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.socialAccountsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {platforms.map((p, idx) => (
            <View
              key={p.key}
              style={[
                styles.socialRow,
                idx < platforms.length - 1 && [styles.socialBorder, { borderBottomColor: colors.border }],
              ]}
            >
              <View style={[styles.socialIconBox, { backgroundColor: `${p.color}15` }]}>
                <Ionicons name={p.icon as any} size={20} color={p.color} />
              </View>
              <View style={styles.socialCol}>
                <Text style={[styles.socialPlatformName, { color: colors.textPrimary }]}>{p.name}</Text>
                <TextInput
                  style={[styles.socialHandleInput, { color: colors.textSecondary }]}
                  value={p.val}
                  onChangeText={(text) =>
                    setSocialLinks((prev) => ({ ...prev, [p.key]: text }))
                  }
                  placeholder="Add link or username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
              {p.val ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addSocialBtn}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert("Add Custom Account", "Connect Threads, Discord, or Twitch link.", [
              {
                text: "Add Threads",
                onPress: () =>
                  setSocialLinks((prev) => ({ ...prev, threads: "@handle" })),
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
        >
          <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.addSocialText, { color: colors.primary }]}>Add Social Account</Text>
        </TouchableOpacity>
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
  socialAccountsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  socialBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  socialIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  socialCol: {
    flex: 1,
  },
  socialPlatformName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  socialHandleInput: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    padding: 0,
  },
  addSocialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
  },
  addSocialText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
});
