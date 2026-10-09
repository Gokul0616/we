import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

const CATEGORIES = [
  "Something isn't working",
  "Feed or Video playback issue",
  "Profile & Account glitch",
  "Abuse or spam report",
  "Other feedback",
];

export default function ReportProblemScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Please explain what happened");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Thank you! Your report has been submitted.");
      router.back();
    }, 800);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Report a Problem"
        rightAction={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Send problem report"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <AppText weight="bold" style={{ fontSize: 16, color: "#2563EB" }}>
                Send
              </AppText>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText style={[styles.instruction, { color: colors.textSecondary }]}>
          Briefly explain what happened and what steps we can take to reproduce the issue.
        </AppText>

        {/* Category Picker */}
        <AppText weight="semiBold" style={[styles.label, { color: colors.textSecondary }]}>Issue Type</AppText>
        <View style={styles.categoryChips}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? "#1E3A8A" : "#EFF6FF")
                      : colors.card,
                    borderColor: isSelected ? "#2563EB" : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={cat}
              >
                <AppText
                  weight={isSelected ? "bold" : "medium"}
                  style={[
                    styles.catText,
                    {
                      color: isSelected ? "#2563EB" : colors.textPrimary,
                    },
                  ]}
                >
                  {cat}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description Input */}
        <AppText weight="semiBold" style={[styles.label, { color: colors.textSecondary }]}>Description</AppText>
        <View style={[styles.textAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.textPrimary, fontFamily: FontFamily.regular }]}
            placeholder="Tell us what went wrong..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
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
    lineHeight: 19,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  catText: {
    fontSize: 13,
  },
  textAreaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 28,
  },
  textArea: {
    height: 120,
    fontSize: 15,
  },
  submitBtn: {
    height: 50,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
