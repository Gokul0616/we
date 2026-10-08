import React from "react";
import { ScrollView, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
} from "../../components/settings/SettingsUI";

export default function HelpSupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleOpenEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      toast.info(`Contact email: ${email}`);
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Help & Support" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Help & Policies */}
        <SettingsSection>
          <SettingsRow
            icon="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and guides"
            onPress={() => router.push("/settings/help-center" as any)}
          />
          <SettingsRow
            icon="warning-outline"
            title="Report a Problem"
            subtitle="Get help with issues"
            onPress={() => router.push("/settings/report-problem" as any)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Safety Center"
            subtitle="Tips for a safer experience"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "safety" } } as any)}
          />
          <SettingsRow
            icon="document-text-outline"
            title="Community Guidelines"
            subtitle="Learn about our rules"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "guidelines" } } as any)}
          />
          <SettingsRow
            icon="newspaper-outline"
            title="Terms of Service"
            subtitle="View our terms"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "terms" } } as any)}
          />
          <SettingsRow
            icon="lock-closed-outline"
            title="Privacy Policy"
            subtitle="View our privacy policy"
            onPress={() => router.push({ pathname: "/settings/legal-view", params: { doc: "privacy" } } as any)}
            isLast
          />
        </SettingsSection>

        {/* Contact Us */}
        <SettingsSection title="Contact Us">
          <SettingsRow
            icon="mail-outline"
            title="Email Support"
            subtitle="support@we.app"
            onPress={() => handleOpenEmail("support@we.app")}
          />
          <SettingsRow
            icon="briefcase-outline"
            title="Business Inquiries"
            subtitle="partnerships@we.app"
            onPress={() => handleOpenEmail("partnerships@we.app")}
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
