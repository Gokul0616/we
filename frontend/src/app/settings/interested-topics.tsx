import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily } from "../../constants/theme";
import { toast } from "../../services/toastService";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";

const TOPICS = [
  { id: "tech", label: "Technology", icon: "laptop-outline" as const },
  { id: "design", label: "Design & UX", icon: "color-palette-outline" as const },
  { id: "photography", label: "Photography", icon: "camera-outline" as const },
  { id: "travel", label: "Travel & Adventure", icon: "airplane-outline" as const },
  { id: "music", label: "Music", icon: "musical-notes-outline" as const },
  { id: "fitness", label: "Fitness & Health", icon: "fitness-outline" as const },
  { id: "gaming", label: "Gaming & Esports", icon: "game-controller-outline" as const },
  { id: "food", label: "Food & Cooking", icon: "restaurant-outline" as const },
  { id: "movies", label: "Movies & Cinema", icon: "film-outline" as const },
  { id: "art", label: "Art & Illustration", icon: "brush-outline" as const },
  { id: "science", label: "Science & Space", icon: "planet-outline" as const },
  { id: "business", label: "Business & Startups", icon: "trending-up-outline" as const },
  { id: "fashion", label: "Fashion & Style", icon: "shirt-outline" as const },
  { id: "books", label: "Books & Literature", icon: "book-outline" as const },
  { id: "nature", label: "Nature & Animals", icon: "leaf-outline" as const },
  { id: "coding", label: "Programming", icon: "code-slash-outline" as const },
];

export default function InterestedTopicsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "tech",
    "design",
    "photography",
    "travel",
    "coding",
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.content_preferences?.interested_topics) {
        setSelectedTopics(user.content_preferences.interested_topics);
      }
    });
  }, []);

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedTopics((prev) => [...prev, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateContentPreferences({ interested_topics: selectedTopics });
      setSaving(false);
      toast.success("Content preferences updated");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to update preferences");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Interested Topics"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save interested topics"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <AppText weight="bold" style={{ fontSize: 16, color: "#2563EB" }}>
                Save
              </AppText>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.instruction, { color: colors.textSecondary }]}>
          Select topics you love to help us personalize your feed, recommendations, and search results.
        </AppText>

        <View style={styles.chipsContainer}>
          {TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? "#2563EB" : "#EFF6FF")
                      : (isDark ? "#18181B" : colors.surface),
                    borderColor: isSelected
                      ? (isDark ? "#3B82F6" : "#2563EB")
                      : (isDark ? "#27272A" : colors.border),
                  },
                ]}
                onPress={() => toggleTopic(topic.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={topic.label}
              >
                <Ionicons
                  name={topic.icon}
                  size={16}
                  color={
                    isSelected
                      ? (isDark ? "#FFFFFF" : "#2563EB")
                      : colors.textSecondary
                  }
                  style={styles.chipIcon}
                />
                <AppText
                  weight={isSelected ? "bold" : "medium"}
                  style={[
                    styles.chipText,
                    {
                      color: isSelected
                        ? (isDark ? "#FFFFFF" : "#2563EB")
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {topic.label}
                </AppText>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={isDark ? "#FFFFFF" : "#2563EB"}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  chipIcon: {
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
  },
});
