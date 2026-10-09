import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Account",
    question: "How do I update my username or profile information?",
    answer:
      "Go to Settings > Profile & Account, or tap Edit Profile on your profile tab. You can update your display name, username, bio, avatar, and other personal information there.",
  },
  {
    id: "2",
    category: "Privacy",
    question: "How can I make my account private?",
    answer:
      "Navigate to Settings > Privacy Settings and toggle the 'Private Account' switch. When private, only followers you approve can view your posts and media.",
  },
  {
    id: "3",
    category: "Security",
    question: "How do I turn on Two-Factor Authentication?",
    answer:
      "Head to Settings > Profile & Account > Password & Security > Two-Factor Authentication, and enable 'Require 2FA Code'. You can choose an Authenticator app or SMS verification.",
  },
  {
    id: "4",
    category: "Media",
    question: "Why isn't my video playing in the grid?",
    answer:
      "Videos in your profile post grid show a video badge indicator to keep browsing fast and battery-efficient. Tap any video post to open it and play in full high-definition with audio controls.",
  },
  {
    id: "5",
    category: "Blocking",
    question: "What happens when I block another user?",
    answer:
      "Blocked users will not be able to find your profile, view your posts, or send you messages. They are never notified that they have been blocked.",
  },
];

export default function HelpCenterScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const filtered = FAQS.filter(
    (item) =>
      item.question.toLowerCase().includes(query.toLowerCase()) ||
      item.answer.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Help Center" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View
          style={[
            styles.searchCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontFamily: FontFamily.regular }]}
            placeholder="Search help articles..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <AppText weight="semiBold" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Frequently Asked Questions
        </AppText>

        <View style={styles.faqList}>
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.question}
              >
                <View style={styles.faqHeader}>
                  <AppText
                    weight="semiBold"
                    style={[
                      styles.faqQuestion,
                      { color: isExpanded ? "#2563EB" : colors.textPrimary },
                    ]}
                  >
                    {item.question}
                  </AppText>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <View
                      style={[styles.divider, { backgroundColor: colors.borderLight }]}
                    />
                    <AppText
                      style={[styles.faqAnswer, { color: colors.textSecondary }]}
                    >
                      {item.answer}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No help articles matching "{query}"
              </AppText>
            </View>
          )}
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
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
    lineHeight: 20,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
