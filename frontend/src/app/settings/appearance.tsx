import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { ThemeMode, FontFamily } from "../../constants/theme";
import { AppText } from "../../components/common/AppText";

export default function AppearanceScreen() {
  const { colors, themeMode, isDark, setThemeMode, iosTabStyle, setIosTabStyle } = useTheme();

  const handleSelectMode = (mode: ThemeMode) => {
    try {
      Vibration.vibrate(25);
    } catch (_) {}
    setThemeMode(mode);
  };

  const handleSelectTabStyle = (style: "native" | "custom") => {
    try {
      Vibration.vibrate(25);
    } catch (_) {}
    setIosTabStyle(style);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Appearance" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Choose how WE looks to you. Select a theme or match your phone's settings automatically.
        </AppText>

        {/* 3-Column Visual Theme Cards */}
        <View style={styles.previewGrid}>
          {/* Light Theme Card */}
          <TouchableOpacity
            style={styles.previewCol}
            onPress={() => handleSelectMode("light")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select light theme"
          >
            <View
              style={[
                styles.deviceMockup,
                {
                  backgroundColor: "#FFFFFF",
                  borderColor: themeMode === "light" ? "#2563EB" : colors.border,
                  borderWidth: themeMode === "light" ? 2.5 : 1.5,
                },
              ]}
            >
              {/* Mini App Header */}
              <View style={styles.mockHeaderLight}>
                <View style={[styles.mockDot, { backgroundColor: "#CBD5E1" }]} />
                <View style={[styles.mockBar, { backgroundColor: "#E2E8F0", width: 28 }]} />
              </View>
              {/* Mini Post Card */}
              <View style={styles.mockPostLight}>
                <View style={[styles.mockAvatar, { backgroundColor: "#2563EB" }]} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={[styles.mockBar, { backgroundColor: "#0F172A", width: "80%" }]} />
                  <View style={[styles.mockBar, { backgroundColor: "#94A3B8", width: "50%" }]} />
                </View>
              </View>
              {/* Mini Media Preview */}
              <View style={[styles.mockMedia, { backgroundColor: "#F1F5F9" }]} />
            </View>
            <View style={styles.labelRow}>
              <View
                style={[
                  styles.radioIndicator,
                  { borderColor: themeMode === "light" ? "#2563EB" : colors.border },
                ]}
              >
                {themeMode === "light" && <View style={styles.radioInner} />}
              </View>
              <AppText
                weight={themeMode === "light" ? "bold" : "medium"}
                style={[
                  styles.modeLabel,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Light
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Dark Theme Card */}
          <TouchableOpacity
            style={styles.previewCol}
            onPress={() => handleSelectMode("dark")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select dark theme"
          >
            <View
              style={[
                styles.deviceMockup,
                {
                  backgroundColor: "#000000",
                  borderColor: themeMode === "dark" ? "#2563EB" : colors.border,
                  borderWidth: themeMode === "dark" ? 2.5 : 1.5,
                },
              ]}
            >
              {/* Mini App Header */}
              <View style={styles.mockHeaderDark}>
                <View style={[styles.mockDot, { backgroundColor: "#27272A" }]} />
                <View style={[styles.mockBar, { backgroundColor: "#27272A", width: 28 }]} />
              </View>
              {/* Mini Post Card */}
              <View style={styles.mockPostDark}>
                <View style={[styles.mockAvatar, { backgroundColor: "#3B82F6" }]} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={[styles.mockBar, { backgroundColor: "#FFFFFF", width: "80%" }]} />
                  <View style={[styles.mockBar, { backgroundColor: "#71717A", width: "50%" }]} />
                </View>
              </View>
              {/* Mini Media Preview */}
              <View style={[styles.mockMedia, { backgroundColor: "#121212" }]} />
            </View>
            <View style={styles.labelRow}>
              <View
                style={[
                  styles.radioIndicator,
                  { borderColor: themeMode === "dark" ? "#2563EB" : colors.border },
                ]}
              >
                {themeMode === "dark" && <View style={styles.radioInner} />}
              </View>
              <AppText
                weight={themeMode === "dark" ? "bold" : "medium"}
                style={[
                  styles.modeLabel,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Dark
              </AppText>
            </View>
          </TouchableOpacity>

          {/* System Auto Card */}
          <TouchableOpacity
            style={styles.previewCol}
            onPress={() => handleSelectMode("system")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Match system theme"
          >
            <View
              style={[
                styles.deviceMockup,
                {
                  backgroundColor: isDark ? "#000000" : "#FFFFFF",
                  borderColor: themeMode === "system" ? "#2563EB" : colors.border,
                  borderWidth: themeMode === "system" ? 2.5 : 1.5,
                },
              ]}
            >
              {/* Split Theme Visualization */}
              <View style={styles.splitMockup}>
                <View style={[styles.splitHalf, { backgroundColor: "#FFFFFF" }]}>
                  <Ionicons name="sunny" size={14} color="#F59E0B" />
                </View>
                <View style={[styles.splitHalf, { backgroundColor: "#000000" }]}>
                  <Ionicons name="moon" size={14} color="#3B82F6" />
                </View>
              </View>
              <View style={styles.systemIconRow}>
                <Ionicons name="sync-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
            <View style={styles.labelRow}>
              <View
                style={[
                  styles.radioIndicator,
                  { borderColor: themeMode === "system" ? "#2563EB" : colors.border },
                ]}
              >
                {themeMode === "system" && <View style={styles.radioInner} />}
              </View>
              <AppText
                weight={themeMode === "system" ? "bold" : "medium"}
                style={[
                  styles.modeLabel,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                System
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Grouped Options Card */}
        <View style={styles.optionsSection}>
          <AppText weight="bold" style={[styles.optionsHeader, { color: colors.textSecondary }]}>
            THEME
          </AppText>

          <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* System Default Row */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleSelectMode("system")}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.optionIconBox, { backgroundColor: isDark ? "#18181B" : "#F1F5F9" }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.optionTextCol}>
                <AppText weight="semiBold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  Match System
                </AppText>
                <AppText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Matches your phone's appearance automatically
                </AppText>
              </View>
              {themeMode === "system" && (
                <Ionicons name="checkmark" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Dark Mode Row */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleSelectMode("dark")}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.optionIconBox, { backgroundColor: isDark ? "#18181B" : "#F1F5F9" }]}>
                <Ionicons name="moon-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.optionTextCol}>
                <AppText weight="semiBold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  Dark Mode
                </AppText>
                <AppText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Easy on the eyes in low light
                </AppText>
              </View>
              {themeMode === "dark" && (
                <Ionicons name="checkmark" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Light Mode Row */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleSelectMode("light")}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={[styles.optionIconBox, { backgroundColor: isDark ? "#18181B" : "#F1F5F9" }]}>
                <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
              </View>
              <View style={styles.optionTextCol}>
                <AppText weight="semiBold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  Light Mode
                </AppText>
                <AppText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Bright, clear look for daytime
                </AppText>
              </View>
              {themeMode === "light" && (
                <Ionicons name="checkmark" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* iOS-Only Bottom Navigation Style */}
        {Platform.OS === "ios" && (
          <View style={styles.optionsSection}>
            <AppText weight="bold" style={[styles.optionsHeader, { color: colors.textSecondary }]}>
              BOTTOM BAR STYLE
            </AppText>

            <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Translucent Glass Option */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleSelectTabStyle("native")}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBox, { backgroundColor: isDark ? "#18181B" : "#EFF6FF" }]}>
                  <Ionicons name="water-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.optionTextCol}>
                  <AppText weight="semiBold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    Translucent Glass
                  </AppText>
                  <AppText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    Modern blurred look that floats over your feed
                  </AppText>
                </View>
                {iosTabStyle === "native" && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              {/* Solid Style Option */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleSelectTabStyle("custom")}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={[styles.optionIconBox, { backgroundColor: isDark ? "#18181B" : "#EFF6FF" }]}>
                  <Ionicons name="browsers-outline" size={18} color="#2563EB" />
                </View>
                <View style={styles.optionTextCol}>
                  <AppText weight="semiBold" style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    Solid Style
                  </AppText>
                  <AppText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    Clean, solid bar that matches your theme
                  </AppText>
                </View>
                {iosTabStyle === "custom" && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  previewCol: {
    flex: 1,
    alignItems: "center",
  },
  deviceMockup: {
    width: "100%",
    height: 125,
    borderRadius: 16,
    padding: 8,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  mockHeaderLight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mockHeaderDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  mockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mockBar: {
    height: 5,
    borderRadius: 2.5,
  },
  mockPostLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mockPostDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mockAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  mockMedia: {
    width: "100%",
    height: 44,
    borderRadius: 6,
  },
  splitMockup: {
    flexDirection: "row",
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.2)",
  },
  splitHalf: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  systemIconRow: {
    alignItems: "center",
    paddingTop: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  radioIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  modeLabel: {
    fontSize: 13,
  },
  optionsSection: {
    marginBottom: 20,
  },
  optionsHeader: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 6,
  },
  optionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  activeStatusCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  activeStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginLeft: 16,
  },
});
