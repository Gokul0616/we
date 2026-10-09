import React, { useState, useEffect } from "react";
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
import { toast } from "../../services/toastService";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsSwitchRow,
} from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

export default function HiddenWordsScreen() {
  const { colors, isDark } = useTheme();

  const [words, setWords] = useState<string[]>(["spam", "scam", "crypto giveaway"]);
  const [newWord, setNewWord] = useState("");
  const [hideComments, setHideComments] = useState(true);
  const [hideMessages, setHideMessages] = useState(true);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.content_preferences?.hidden_words) {
        setWords(user.content_preferences.hidden_words);
      }
    });
  }, []);

  const handleAddWord = async () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;
    if (words.includes(trimmed)) {
      toast.info("Word is already in your hidden list");
      return;
    }
    const updated = [...words, trimmed];
    setWords(updated);
    setNewWord("");
    await userService.updateContentPreferences({ hidden_words: updated });
    toast.success(`"${trimmed}" added to hidden words`);
  };

  const handleRemoveWord = async (word: string) => {
    const updated = words.filter((w) => w !== word);
    setWords(updated);
    await userService.updateContentPreferences({ hidden_words: updated });
    toast.info(`"${word}" removed`);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Hidden Words" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText style={[styles.instruction, { color: colors.textSecondary }]}>
          Hide comments and direct messages that contain these specific words, phrases, or emojis from your account.
        </AppText>

        <SettingsSection title="Automated Protection">
          <SettingsSwitchRow
            icon="chatbubbles-outline"
            title="Hide offensive comments"
            subtitle="Filters out abusive or scam comments"
            value={hideComments}
            onValueChange={setHideComments}
          />
          <SettingsSwitchRow
            icon="mail-outline"
            title="Hide offensive messages"
            subtitle="Move suspicious message requests to hidden folder"
            value={hideMessages}
            onValueChange={setHideMessages}
            isLast
          />
        </SettingsSection>

        {/* Custom Words Section */}
        <AppText weight="semiBold" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Custom Words & Phrases
        </AppText>

        <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, fontFamily: FontFamily.regular }]}
            placeholder="Add word or phrase..."
            placeholderTextColor={colors.textMuted}
            value={newWord}
            onChangeText={setNewWord}
            onSubmitEditing={handleAddWord}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, !newWord.trim() && { opacity: 0.5 }]}
            onPress={handleAddWord}
            disabled={!newWord.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add hidden word"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {words.map((word) => (
            <View
              key={word}
              style={[
                styles.wordTag,
                {
                  backgroundColor: isDark ? "#18181B" : "#F1F5F9",
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText weight="medium" style={[styles.wordText, { color: colors.textPrimary }]}>{word}</AppText>
              <TouchableOpacity
                onPress={() => handleRemoveWord(word)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${word}`}
              >
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
          {words.length === 0 && (
            <AppText style={[styles.emptyText, { color: colors.textMuted }]}>
              No custom hidden words added yet.
            </AppText>
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
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
    letterSpacing: 0.2,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 16,
  },
  wordTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  wordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    paddingHorizontal: 4,
  },
});
