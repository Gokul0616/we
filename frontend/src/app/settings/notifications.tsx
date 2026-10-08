import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsSwitchRow,
} from "../../components/settings/SettingsUI";

export default function NotificationsSettingsScreen() {
  const { colors } = useTheme();

  // Push notifications state
  const [newFollowers, setNewFollowers] = useState(true);
  const [likes, setLikes] = useState(true);
  const [comments, setComments] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reels, setReels] = useState(true);
  const [live, setLive] = useState(true);

  // Email notifications state
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  // In-app notifications state
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.notification_settings) {
        const ns = user.notification_settings;
        if (ns.new_followers !== undefined) setNewFollowers(ns.new_followers);
        if (ns.likes !== undefined) setLikes(ns.likes);
        if (ns.comments !== undefined) setComments(ns.comments);
        if (ns.mentions !== undefined) setMentions(ns.mentions);
        if (ns.messages !== undefined) setMessages(ns.messages);
        if (ns.reels !== undefined) setReels(ns.reels);
        if (ns.live !== undefined) setLive(ns.live);
        if (ns.activity_updates !== undefined) setActivityUpdates(ns.activity_updates);
        if (ns.marketing_updates !== undefined) setMarketingUpdates(ns.marketing_updates);
        if (ns.sounds !== undefined) setSounds(ns.sounds);
        if (ns.vibration !== undefined) setVibration(ns.vibration);
      }
    });
  }, []);

  const updateSetting = async (key: string, val: boolean) => {
    await userService.updateNotificationSettings({ [key]: val });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Notifications" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications */}
        <SettingsSection title="Push Notifications">
          <SettingsSwitchRow
            icon="person-add-outline"
            title="New Followers"
            value={newFollowers}
            onValueChange={(val) => {
              setNewFollowers(val);
              updateSetting("new_followers", val);
            }}
          />
          <SettingsSwitchRow
            icon="heart-outline"
            title="Likes"
            value={likes}
            onValueChange={(val) => {
              setLikes(val);
              updateSetting("likes", val);
            }}
          />
          <SettingsSwitchRow
            icon="chatbubble-outline"
            title="Comments"
            value={comments}
            onValueChange={(val) => {
              setComments(val);
              updateSetting("comments", val);
            }}
          />
          <SettingsSwitchRow
            icon="at-outline"
            title="Mentions"
            value={mentions}
            onValueChange={(val) => {
              setMentions(val);
              updateSetting("mentions", val);
            }}
          />
          <SettingsSwitchRow
            icon="mail-outline"
            title="Messages"
            value={messages}
            onValueChange={(val) => {
              setMessages(val);
              updateSetting("messages", val);
            }}
          />
          <SettingsSwitchRow
            icon="film-outline"
            title="Reels"
            value={reels}
            onValueChange={(val) => {
              setReels(val);
              updateSetting("reels", val);
            }}
          />
          <SettingsSwitchRow
            icon="videocam-outline"
            title="Live"
            value={live}
            onValueChange={(val) => {
              setLive(val);
              updateSetting("live", val);
            }}
            isLast
          />
        </SettingsSection>

        {/* Email Notifications */}
        <SettingsSection title="Email Notifications">
          <SettingsSwitchRow
            icon="notifications-outline"
            title="Activity Updates"
            value={activityUpdates}
            onValueChange={(val) => {
              setActivityUpdates(val);
              updateSetting("activity_updates", val);
            }}
          />
          <SettingsSwitchRow
            icon="megaphone-outline"
            title="Marketing & Updates"
            value={marketingUpdates}
            onValueChange={(val) => {
              setMarketingUpdates(val);
              updateSetting("marketing_updates", val);
            }}
            isLast
          />
        </SettingsSection>

        {/* In-App Notifications */}
        <SettingsSection title="In-App Notifications">
          <SettingsSwitchRow
            icon="volume-high-outline"
            title="Sounds"
            value={sounds}
            onValueChange={(val) => {
              setSounds(val);
              updateSetting("sounds", val);
            }}
          />
          <SettingsSwitchRow
            icon="phone-portrait-outline"
            title="Vibration"
            value={vibration}
            onValueChange={(val) => {
              setVibration(val);
              updateSetting("vibration", val);
            }}
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
