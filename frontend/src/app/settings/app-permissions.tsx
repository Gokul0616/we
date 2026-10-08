import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import { showAlert } from "../../services/alertService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsSwitchRow,
} from "../../components/settings/SettingsUI";

export default function AppPermissionsScreen() {
  const { colors } = useTheme();

  // Permission toggles
  const [cameraAllowed, setCameraAllowed] = useState(true);
  const [photosAllowed, setPhotosAllowed] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(true);
  const [notificationsAllowed, setNotificationsAllowed] = useState(true);

  // Data stats
  const [dataUsed, setDataUsed] = useState("248 MB");

  const handleResetData = () => {
    showAlert(
      "Reset Data Usage Stats?",
      "This will reset all accumulated network cache and data statistics.",
      [
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setDataUsed("0 MB");
            toast.success("Data usage stats reset");
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
      <SettingsHeader title="App Permissions" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Permissions */}
        <SettingsSection title="Device Permissions">
          <SettingsSwitchRow
            icon="camera-outline"
            title="Camera"
            subtitle="Access to camera for photos and videos"
            value={cameraAllowed}
            onValueChange={(val) => {
              setCameraAllowed(val);
              toast.info(`Camera permission ${val ? "enabled" : "disabled"}`);
            }}
          />
          <SettingsSwitchRow
            icon="images-outline"
            title="Photos"
            subtitle="Access to your photo library"
            value={photosAllowed}
            onValueChange={(val) => {
              setPhotosAllowed(val);
              toast.info(`Photo library permission ${val ? "enabled" : "disabled"}`);
            }}
          />
          <SettingsSwitchRow
            icon="location-outline"
            title="Location"
            subtitle="Help us show you relevant content"
            value={locationAllowed}
            onValueChange={(val) => {
              setLocationAllowed(val);
              toast.info(`Location access ${val ? "enabled" : "disabled"}`);
            }}
          />
          <SettingsSwitchRow
            icon="mic-outline"
            title="Microphone"
            subtitle="For video recording and voice messages"
            value={micAllowed}
            onValueChange={(val) => {
              setMicAllowed(val);
              toast.info(`Microphone permission ${val ? "enabled" : "disabled"}`);
            }}
          />
          <SettingsSwitchRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Allow app to send notifications"
            value={notificationsAllowed}
            onValueChange={(val) => {
              setNotificationsAllowed(val);
              toast.info(`Notification permission ${val ? "enabled" : "disabled"}`);
            }}
            isLast
          />
        </SettingsSection>

        {/* Data Usage & Reset */}
        <SettingsSection title="Data Usage">
          <View style={styles.dataRow}>
            <View style={styles.dataLeft}>
              <Ionicons
                name="cellular-outline"
                size={20}
                color={colors.textPrimary}
                style={styles.icon}
              />
              <Text style={[styles.dataLabel, { color: colors.textPrimary }]}>
                Total data used
              </Text>
            </View>
            <Text style={[styles.dataValue, { color: colors.textSecondary }]}>
              {dataUsed}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.borderLight, marginLeft: 52 },
            ]}
          />

          <View style={styles.dataRow}>
            <View style={styles.dataLeft}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.textPrimary}
                style={styles.icon}
              />
              <Text style={[styles.dataLabel, { color: colors.textPrimary }]}>
                Reset Stats
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetData}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
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
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  dataLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 28,
  },
  dataLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
});
