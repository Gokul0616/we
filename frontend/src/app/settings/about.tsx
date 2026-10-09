import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
} from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";

const SOCIAL_LINKS = [
  { name: "Instagram", icon: "logo-instagram" as const, color: "#E1306C" },
  { name: "X", icon: "logo-twitter" as const, color: "#1DA1F2" },
  { name: "YouTube", icon: "logo-youtube" as const, color: "#FF0000" },
  { name: "TikTok", icon: "logo-tiktok" as const, color: "#00F2FE" },
  { name: "LinkedIn", icon: "logo-linkedin" as const, color: "#0A66C2" },
];

export default function AboutWeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="About WE" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Center Hero */}
        <View style={styles.brandHero}>
          <AppText weight="bold" style={styles.brandTitle}>WE</AppText>
          <AppText weight="semiBold" style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 1.0.0
          </AppText>
          <AppText weight="medium" style={[styles.taglineText, { color: colors.textSecondary }]}>
            Connect. Share. Belong.
          </AppText>
        </View>

        {/* Mission & Values */}
        <SettingsSection>
          <SettingsRow
            icon="business-outline"
            title="Our Mission"
            subtitle="Building a more connected world"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "mission" } } as any)}
          />
          <SettingsRow
            icon="heart-outline"
            title="Our Values"
            subtitle="Authenticity, Community, Creativity"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "values" } } as any)}
            isLast
          />
        </SettingsSection>

        {/* Follow Us Section */}
        <View style={styles.followSection}>
          <AppText weight="semiBold" style={[styles.followTitle, { color: colors.textSecondary }]}>
            Follow Us
          </AppText>
          <View style={styles.socialRow}>
            {SOCIAL_LINKS.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => toast.info(`Follow WE on ${item.name}`)}
                accessibilityRole="button"
                accessibilityLabel={`Follow WE on ${item.name}`}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 36,
  },
  brandHero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: -1.5,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    fontStyle: "italic",
  },
  followSection: {
    marginTop: 32,
    marginHorizontal: 16,
    alignItems: "center",
  },
  followTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
