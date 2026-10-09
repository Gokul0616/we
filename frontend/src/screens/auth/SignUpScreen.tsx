import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WeLogo } from "../../components/WeLogo";
import { GoogleIcon, AppleIcon, MailIcon } from "../../components/SocialIcons";
import { Colors } from "../../constants/theme";
import { AppText } from "../../components/common/AppText";
import { useTheme } from "../../context/ThemeContext";

interface SignUpScreenProps {
  onGoogleSignUp?: () => void;
  onAppleSignUp?: () => void;
  onEmailSignUp?: () => void;
  onLogIn?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
  onBack?: () => void;
}

export function SignUpScreen({
  onGoogleSignUp,
  onAppleSignUp,
  onEmailSignUp,
  onLogIn,
  onTerms,
  onPrivacy,
  onBack,
}: SignUpScreenProps) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Top Navigation */}
      {onBack && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* Header Branding */}
        <View style={styles.brandHeader}>
          <WeLogo size="md" color={colors.textPrimary} />
          <AppText variant="screenTitle" style={[styles.title, { color: colors.textPrimary }]}>
            Create your account
          </AppText>
          <AppText variant="body" align="center" style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join a community of creators, thinkers and doers.
          </AppText>
        </View>

        {/* Auth Buttons Stack */}
        <View style={styles.buttonsStack}>
          {/* Google Button */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: isDark ? colors.card : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={onGoogleSignUp}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <View style={styles.iconContainer}>
              <GoogleIcon size={20} />
            </View>
            <AppText variant="body" weight="semibold" style={[styles.socialButtonText, { color: colors.textPrimary }]}>
              Continue with Google
            </AppText>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>

          {/* Apple Button */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: isDark ? colors.card : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={onAppleSignUp}
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
          >
            <View style={styles.iconContainer}>
              <AppleIcon size={20} color={colors.textPrimary} />
            </View>
            <AppText variant="body" weight="semibold" style={[styles.socialButtonText, { color: colors.textPrimary }]}>
              Continue with Apple
            </AppText>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>

          {/* Email Button */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: isDark ? colors.card : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={onEmailSignUp}
            accessibilityRole="button"
            accessibilityLabel="Continue with Email"
          >
            <View style={styles.iconContainer}>
              <MailIcon size={20} color={colors.textPrimary} />
            </View>
            <AppText variant="body" weight="semibold" style={[styles.socialButtonText, { color: colors.textPrimary }]}>
              Continue with Email
            </AppText>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.legalContainer}>
          <AppText variant="caption" align="center" style={[styles.legalText, { color: colors.textMuted }]}>
            By continuing, you agree to our{"\n"}
            <AppText
              variant="caption"
              weight="semibold"
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={onTerms}
            >
              Terms of Service
            </AppText>{" "}
            and{" "}
            <AppText
              variant="caption"
              weight="semibold"
              style={[styles.legalLink, { color: colors.primary }]}
              onPress={onPrivacy}
            >
              Privacy Policy
            </AppText>
            .
          </AppText>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" style={[styles.footerText, { color: colors.textSecondary }]}>
            {"Already have an account? "}
          </AppText>
          <TouchableOpacity activeOpacity={0.7} onPress={onLogIn}>
            <AppText variant="bodySmall" weight="bold" style={[styles.footerLink, { color: colors.primary }]}>
              Log In
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 24,
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginTop: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 260,
  },
  buttonsStack: {
    gap: 14,
    marginTop: 24,
  },
  socialButton: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 27,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 24,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    letterSpacing: -0.2,
  },
  legalContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  legalText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94A3B8",
    textAlign: "center",
  },
  legalLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: "#64748B",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
