import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import { showAlert } from "../../services/alertService";
import { SettingsHeader, SettingsSection } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";

interface Session {
  id: string;
  device: string;
  location: string;
  time: string;
  isCurrent: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: "1",
    device: "iPhone 15 Pro",
    location: "Mumbai, India",
    time: "Active now",
    isCurrent: true,
    icon: "phone-portrait-outline",
  },
  {
    id: "2",
    device: "Chrome on macOS",
    location: "Bengaluru, India",
    time: "Yesterday at 18:42",
    isCurrent: false,
    icon: "laptop-outline",
  },
  {
    id: "3",
    device: "iPad Air",
    location: "Delhi, India",
    time: "3 days ago",
    isCurrent: false,
    icon: "tablet-portrait-outline",
  },
];

export default function LoginActivityScreen() {
  const { colors, isDark } = useTheme();
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const handleLogoutOthers = () => {
    showAlert(
      "Log Out of Other Sessions?",
      "You will remain logged in only on this device. All other browser and mobile sessions will be logged out.",
      [
        {
          text: "Log Out Others",
          style: "destructive",
          onPress: () => {
            setSessions((prev) => prev.filter((s) => s.isCurrent));
            toast.success("Logged out of all other sessions");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleLogoutSession = (id: string, name: string) => {
    showAlert(
      `Log out of ${name}?`,
      "This session will be terminated immediately.",
      [
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            setSessions((prev) => prev.filter((s) => s.id !== id));
            toast.info(`Logged out of ${name}`);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Login Activity" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppText weight="semiBold" style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Where you're logged in
        </AppText>

        <SettingsSection>
          {sessions.map((s, index) => (
            <View key={s.id}>
              <View style={styles.sessionRow}>
                <View
                  style={[
                    styles.deviceIcon,
                    { backgroundColor: s.isCurrent ? (isDark ? "#18181B" : "#EFF6FF") : colors.surface },
                  ]}
                >
                  <Ionicons
                    name={s.icon}
                    size={22}
                    color={s.isCurrent ? "#2563EB" : colors.textPrimary}
                  />
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.titleRow}>
                    <AppText weight="semiBold" style={[styles.deviceText, { color: colors.textPrimary }]}>
                      {s.device}
                    </AppText>
                    {s.isCurrent && (
                      <View style={styles.currentBadge}>
                        <AppText weight="semiBold" style={styles.currentBadgeText}>This Device</AppText>
                      </View>
                    )}
                  </View>
                  <AppText style={[styles.subText, { color: colors.textSecondary }]}>
                    {s.location} • {s.time}
                  </AppText>
                </View>

                {!s.isCurrent && (
                  <TouchableOpacity
                    onPress={() => handleLogoutSession(s.id, s.device)}
                    style={styles.logoutSmallBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Log out of ${s.device}`}
                  >
                    <AppText weight="semiBold" style={[styles.logoutSmallText, { color: colors.danger }]}>
                      Log out
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
              {index < sessions.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.borderLight, marginLeft: 64 },
                  ]}
                />
              )}
            </View>
          ))}
        </SettingsSection>

        {sessions.length > 1 && (
          <TouchableOpacity
            style={[styles.logoutAllBtn, { borderColor: colors.border }]}
            onPress={handleLogoutOthers}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Log out of all other sessions"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
            <AppText weight="semiBold" style={[styles.logoutAllText, { color: colors.danger }]}>
              Log out of all other sessions
            </AppText>
          </TouchableOpacity>
        )}
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 20,
    marginHorizontal: 20,
    letterSpacing: 0.2,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceText: {
    fontSize: 15,
    fontWeight: "600",
  },
  currentBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
  },
  subText: {
    fontSize: 12,
    marginTop: 3,
  },
  logoutSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutSmallText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  logoutAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
