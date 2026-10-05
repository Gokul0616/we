import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WeLogo } from "../../components/WeLogo";
import { GoogleIcon, AppleIcon, MailIcon } from "../../components/SocialIcons";
import { Colors } from "../../constants/theme";

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
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Navigation */}
      {onBack && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* Header Branding */}
        <View style={styles.brandHeader}>
          <WeLogo size="md" color="#1E293B" />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join a community of creators, thinkers and doers.
          </Text>
        </View>

        {/* Auth Buttons Stack */}
        <View style={styles.buttonsStack}>
          {/* Google Button */}
          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={onGoogleSignUp}
          >
            <View style={styles.iconContainer}>
              <GoogleIcon size={20} />
            </View>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>

          {/* Apple Button */}
          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={onAppleSignUp}
          >
            <View style={styles.iconContainer}>
              <AppleIcon size={20} color="#000000" />
            </View>
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>

          {/* Email Button */}
          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={onEmailSignUp}
          >
            <View style={styles.iconContainer}>
              <MailIcon size={20} color="#1E293B" />
            </View>
            <Text style={styles.socialButtonText}>Continue with Email</Text>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{"\n"}
            <Text style={styles.legalLink} onPress={onTerms}>
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text style={styles.legalLink} onPress={onPrivacy}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onLogIn}>
            <Text style={styles.footerLink}>Log In</Text>
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
