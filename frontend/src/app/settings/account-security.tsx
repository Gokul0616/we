import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import { showAlert } from "../../services/alertService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
} from "../../components/settings/SettingsUI";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleDeleteAccount = () => {
    showAlert(
      "Delete Account?",
      "Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be erased.",
      [
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            toast.error("Account deletion requested. Please confirm via email.");
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
      <SettingsHeader title="Account Settings" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection>
          <SettingsRow
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push("/settings/change-password" as any)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Two-Factor Authentication"
            subtitle="Add extra security"
            onPress={() => router.push("/settings/two-factor" as any)}
          />
          <SettingsRow
            icon="desktop-outline"
            title="Login Activity"
            subtitle="View recent logins"
            onPress={() => router.push("/settings/login-activity" as any)}
          />
          <SettingsRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            destructive
            onPress={() => router.push("/settings/delete-account" as any)}
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
