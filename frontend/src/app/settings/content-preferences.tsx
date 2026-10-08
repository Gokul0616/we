import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
  SettingsSwitchRow,
  SettingsRadioRow,
} from "../../components/settings/SettingsUI";

export default function ContentPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [showSensitive, setShowSensitive] = useState(false);
  const [mediaQuality, setMediaQuality] = useState<"high" | "saver">("high");

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.content_preferences) {
        const cp = user.content_preferences;
        if (cp.show_sensitive !== undefined) setShowSensitive(cp.show_sensitive);
        if (cp.media_quality !== undefined) setMediaQuality(cp.media_quality);
      }
    });
  }, []);

  const handleToggleSensitive = async (val: boolean) => {
    setShowSensitive(val);
    await userService.updateContentPreferences({ show_sensitive: val });
  };

  const handleSelectQuality = async (q: "high" | "saver") => {
    setMediaQuality(q);
    await userService.updateContentPreferences({ media_quality: q });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Content Preferences" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Feed Settings */}
        <SettingsSection title="Feed Settings">
          <SettingsSwitchRow
            icon="shield-outline"
            title="Show sensitive content"
            subtitle="You may see content that some people find sensitive."
            value={showSensitive}
            onValueChange={handleToggleSensitive}
            isLast
          />
        </SettingsSection>

        {/* Media Quality */}
        <SettingsSection title="Media Quality">
          <SettingsRadioRow
            title="High quality (recommended)"
            subtitle="Better quality uses more data"
            selected={mediaQuality === "high"}
            onSelect={() => handleSelectQuality("high")}
          />
          <SettingsRadioRow
            title="Data saver"
            subtitle="Lower quality, uses less data"
            selected={mediaQuality === "saver"}
            onSelect={() => handleSelectQuality("saver")}
            isLast
          />
        </SettingsSection>

        {/* Language */}
        <SettingsSection title="Language">
          <SettingsRow
            icon="globe-outline"
            title="Language"
            value="English"
            onPress={() => router.push("/settings/language" as any)}
            isLast
          />
        </SettingsSection>

        {/* Content Controls */}
        <SettingsSection title="Content Controls">
          <SettingsRow
            icon="compass-outline"
            title="Interested topics"
            subtitle="Manage what you see"
            onPress={() => router.push("/settings/interested-topics" as any)}
          />
          <SettingsRow
            icon="eye-off-outline"
            title="Hidden words"
            subtitle="Hide specific words and phrases"
            onPress={() => router.push("/settings/hidden-words" as any)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="App Permissions & Data"
            subtitle="Permissions and network usage"
            onPress={() => router.push("/settings/app-permissions" as any)}
            isLast
          />
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
