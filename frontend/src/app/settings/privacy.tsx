import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
  SettingsSwitchRow,
} from "../../components/settings/SettingsUI";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [isPrivate, setIsPrivate] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [showActivity, setShowActivity] = useState(true);
  const [allowDms, setAllowDms] = useState(true);

  const [commentsAudience, setCommentsAudience] = useState("Everyone");
  const [mentionsAudience, setMentionsAudience] = useState("Everyone");
  const [storyAudience, setStoryAudience] = useState("Everyone");
  const [reelsAudience, setReelsAudience] = useState("Everyone");
  const [liveAudience, setLiveAudience] = useState("Everyone");
  const [contactsSync, setContactsSync] = useState("Off");

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.privacy_settings) {
        const ps = user.privacy_settings;
        if (ps.visibility) {
          setVisibility(ps.visibility);
          setIsPrivate(ps.visibility === "private");
        }
        if (ps.show_activity_status !== undefined) {
          setShowActivity(ps.show_activity_status);
        }
        if (ps.allow_direct_messages !== undefined) {
          setAllowDms(ps.allow_direct_messages);
        }
      }
    });
  }, []);

  const handleTogglePrivate = async (val: boolean) => {
    setIsPrivate(val);
    const newVis = val ? "private" : "public";
    setVisibility(newVis);
    try {
      await userService.updatePrivacy({ visibility: newVis });
      toast.success(val ? "Account set to private" : "Account set to public");
    } catch (_) {}
  };

  const handleToggleActivity = async (val: boolean) => {
    setShowActivity(val);
    try {
      await userService.updatePrivacy({ show_activity_status: val });
      toast.info(`Activity status ${val ? "visible" : "hidden"}`);
    } catch (_) {}
  };

  const handleToggleDms = async (val: boolean) => {
    setAllowDms(val);
    try {
      await userService.updatePrivacy({ allow_direct_messages: val });
      toast.info(`Direct messages ${val ? "allowed" : "restricted"}`);
    } catch (_) {}
  };

  const openAudience = (title: string, current: string) => {
    router.push({
      pathname: "/settings/audience-selection",
      params: { title, current },
    } as any);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Privacy Settings" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Privacy */}
        <SettingsSection title="Account Privacy">
          <SettingsSwitchRow
            icon="lock-closed-outline"
            title="Private Account"
            subtitle="Only approved followers can see your posts, reels and stories."
            value={isPrivate}
            onValueChange={handleTogglePrivate}
          />
          <SettingsSwitchRow
            icon="radio-button-on-outline"
            title="Activity Status"
            subtitle="Allow accounts you follow to see when you were last active"
            value={showActivity}
            onValueChange={handleToggleActivity}
          />
          <SettingsSwitchRow
            icon="chatbubbles-outline"
            title="Direct Messages"
            subtitle="Allow direct message requests from people"
            value={allowDms}
            onValueChange={handleToggleDms}
            isLast
          />
        </SettingsSection>

        {/* Interactions */}
        <SettingsSection title="Interactions">
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            title="Comments"
            value={commentsAudience}
            onPress={() => openAudience("Comments", commentsAudience)}
          />
          <SettingsRow
            icon="at-outline"
            title="Mentions"
            value={mentionsAudience}
            onPress={() => openAudience("Mentions", mentionsAudience)}
          />
          <SettingsRow
            icon="time-outline"
            title="Story"
            value={storyAudience}
            onPress={() => openAudience("Story", storyAudience)}
          />
          <SettingsRow
            icon="film-outline"
            title="Reels"
            value={reelsAudience}
            onPress={() => openAudience("Reels", reelsAudience)}
          />
          <SettingsRow
            icon="videocam-outline"
            title="Live"
            value={liveAudience}
            onPress={() => openAudience("Live", liveAudience)}
            isLast
          />
        </SettingsSection>

        {/* Connections */}
        <SettingsSection title="Connections">
          <SettingsRow
            icon="people-outline"
            title="Find People"
            value="Discover"
            onPress={() => router.push("/search" as any)}
          />
          <SettingsRow
            icon="book-outline"
            title="Contacts"
            value={contactsSync}
            onPress={() => {
              const next = contactsSync === "Off" ? "On" : "Off";
              setContactsSync(next);
              toast.info(`Contacts syncing ${next}`);
            }}
          />
          <SettingsRow
            icon="ban-outline"
            title="Blocked Users"
            value="0"
            onPress={() => router.push("/settings/blocked-users" as any)}
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
