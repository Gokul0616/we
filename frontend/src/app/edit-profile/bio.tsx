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

const BIO_SUGGESTIONS = [
  "Developer",
  "Traveler",
  "Foodie",
  "Tech Enthusiast",
  "Nature Lover",
  "Minimalist",
];

const EMOJI_LIST = ["🌍", "✈️", "🏔️", "☕", "❤️", "💻", "✨", "🔥"];

export default function EditBioScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.bio !== undefined) {
        setBio(u.bio);
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        bio: bio.trim(),
      });
      setSaving(false);
      toast.success("Bio updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save bio error:", e);
      Alert.alert("Error", "Failed to update bio.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Bio</Text>
        <TouchableOpacity style={styles.headerSaveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerSaveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card Input with character counter */}
        <View style={[styles.bioCardInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.bioTextInput, { color: colors.textPrimary }]}
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 150) setBio(text);
            }}
            placeholder="Write a bio..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
          <Text style={[styles.bioCharCounter, { color: colors.textSecondary }]}>{bio.length}/150</Text>
        </View>

        {/* Bio Suggestions Section */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Bio Suggestions</Text>
        <View style={styles.suggestionsWrap}>
          {BIO_SUGGESTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.suggestionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (!bio) {
                  setBio(item);
                } else if (!bio.includes(item)) {
                  setBio((prev) => `${prev} | ${item}`.slice(0, 150));
                }
              }}
            >
              <Text style={[styles.suggestionPillText, { color: colors.textPrimary }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Emojis Section */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Add Emojis</Text>
        <View style={styles.emojiRow}>
          {EMOJI_LIST.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (bio.length < 148) {
                  setBio((prev) => `${prev} ${emoji}`.trim());
                }
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
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
  bioCardInput: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bioTextInput: {
    fontSize: 15,
    color: "#0F172A",
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
  },
  bioCharCounter: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 8,
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
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emojiText: {
    fontSize: 20,
  },
});
