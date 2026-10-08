import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsSwitchRow,
  SettingsRow,
} from "../../components/settings/SettingsUI";

export default function TwoFactorScreen() {
  const { colors, isDark } = useTheme();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [authAppEnabled, setAuthAppEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.two_factor) {
        setTwoFactorEnabled(Boolean(user.two_factor.enabled));
        setAuthAppEnabled(Boolean(user.two_factor.auth_app));
        setSmsEnabled(Boolean(user.two_factor.sms));
      }
    });
  }, []);

  const handleToggle2FA = async (val: boolean) => {
    setTwoFactorEnabled(val);
    const authApp = val ? true : false;
    const sms = false;
    if (!val) {
      setAuthAppEnabled(false);
      setSmsEnabled(false);
    } else {
      setAuthAppEnabled(true);
    }
    await userService.updateTwoFactor({ enabled: val, auth_app: authApp, sms });
    toast.info(val ? "Two-Factor Authentication enabled" : "Two-Factor Authentication disabled");
  };

  const handleToggleAuthApp = async (val: boolean) => {
    setAuthAppEnabled(val);
    await userService.updateTwoFactor({ auth_app: val });
    toast.success(val ? "Authenticator App linked" : "Authenticator App unlinked");
  };

  const handleToggleSms = async (val: boolean) => {
    setSmsEnabled(val);
    await userService.updateTwoFactor({ sms: val });
    toast.success(val ? "SMS verification enabled" : "SMS verification disabled");
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Two-Factor Authentication" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBox}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? "#18181B" : "#EFF6FF" }]}>
            <Ionicons name="shield-checkmark" size={36} color="#2563EB" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Protect your WE account
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Add an extra layer of security. We'll ask for a login code whenever you sign in on an unrecognized device.
          </Text>
        </View>

        <SettingsSection title="Status">
          <SettingsSwitchRow
            icon="shield-outline"
            title="Require 2FA Code"
            subtitle="Require security code on new logins"
            value={twoFactorEnabled}
            onValueChange={handleToggle2FA}
            isLast
          />
        </SettingsSection>

        {twoFactorEnabled && (
          <>
            <SettingsSection title="Security Methods">
              <SettingsSwitchRow
                icon="phone-portrait-outline"
                title="Authenticator App"
                subtitle="Google Authenticator, 1Password, or Authy"
                value={authAppEnabled}
                onValueChange={handleToggleAuthApp}
              />
              <SettingsSwitchRow
                icon="chatbox-ellipses-outline"
                title="Text Message (SMS)"
                subtitle="Send verification codes to your mobile"
                value={smsEnabled}
                onValueChange={handleToggleSms}
                isLast
              />
            </SettingsSection>

            <SettingsSection title="Recovery">
              <SettingsRow
                icon="key-outline"
                title="Backup Codes"
                subtitle="Use single-use codes when your phone is unavailable"
                onPress={() => toast.info("10 single-use backup codes generated")}
                isLast
              />
            </SettingsSection>
          </>
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
  heroBox: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
