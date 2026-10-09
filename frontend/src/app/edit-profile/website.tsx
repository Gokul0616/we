import React, { useState, useEffect } from "react";
import {
  View,
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
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

const QUICK_WEBSITE_LINKS = ["Portfolio", "GitHub", "LinkedIn", "Twitter"];

export default function EditWebsiteScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.website !== undefined) {
        setWebsite(u.website);
      }
      if (u?.username) {
        setUsername(u.username);
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        website: website.trim(),
      });
      setSaving(false);
      toast.success("Website updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save website error:", e);
      Alert.alert("Error", "Failed to update website link.");
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
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Website</AppText>
        <TouchableOpacity
          style={styles.headerSaveButton}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save website"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText weight="bold" style={[styles.headerSaveText, { color: colors.primary }]}>Save</AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Website Input Card */}
        <View style={[styles.websiteInputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText weight="semiBold" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Website URL</AppText>
          <View style={[styles.websiteInputRow, { borderColor: colors.border }]}>
            <Ionicons name="link-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.websiteTextInput, { color: colors.textPrimary, fontFamily: FontFamily.regular }]}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Quick Links Section */}
        <AppText weight="bold" style={[styles.sectionHeading, { color: colors.textPrimary }]}>Quick Links</AppText>
        <View style={styles.suggestionsWrap}>
          {QUICK_WEBSITE_LINKS.map((link) => (
            <TouchableOpacity
              key={link}
              style={[styles.suggestionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (link === "GitHub") setWebsite(`https://github.com/${username}`);
                else if (link === "LinkedIn") setWebsite(`https://linkedin.com/in/${username}`);
                else if (link === "Twitter") setWebsite(`https://x.com/${username}`);
                else setWebsite(`https://${username}.dev`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Use quick link ${link}`}
            >
              <AppText weight="semiBold" style={[styles.suggestionPillText, { color: colors.textPrimary }]}>{link}</AppText>
            </TouchableOpacity>
          ))}
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
  websiteInputCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  websiteInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  websiteTextInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  suggestionPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
});
