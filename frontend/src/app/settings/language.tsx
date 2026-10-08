import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRadioRow,
} from "../../components/settings/SettingsUI";

interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文 (简体)" },
];

export default function LanguageSettingsScreen() {
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleSelect = (code: string, name: string) => {
    setSelectedLanguage(code);
    toast.success(`Language set to ${name}`);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Language" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          {LANGUAGES.map((lang, index) => (
            <SettingsRadioRow
              key={lang.code}
              title={lang.name}
              selected={selectedLanguage === lang.code}
              onSelect={() => handleSelect(lang.code, lang.name)}
              isLast={index === LANGUAGES.length - 1}
            />
          ))}
        </SettingsSection>
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
    paddingBottom: 36,
  },
});
