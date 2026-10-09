import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontFamily } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";
import { AppText } from "../../components/common/AppText";
import { AppButton } from "../../components/common/AppButton";
import { useTheme } from "../../context/ThemeContext";

interface EmailInputScreenProps {
  onContinue: (email: string) => void;
  onBack: () => void;
}

export function EmailInputScreen({ onContinue, onBack }: EmailInputScreenProps) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);

  const isValidEmail = email.includes("@") && email.includes(".");

  const handleNext = async () => {
    if (!isValidEmail || isLoading) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await apiClient.post(ENDPOINTS.auth.sendOtp, {
        email: email.trim().toLowerCase(),
      });
      onContinue(email.trim().toLowerCase());
    } catch (err: any) {
      // Toast notification is shown automatically by apiClient interceptor.
      // Do not proceed next if sending OTP fails.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Bar */}
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <AppText variant="screenTitle" style={[styles.title, { color: colors.textPrimary }]}>
                What's your email?
              </AppText>
              <AppText variant="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
                We'll send a 6-digit verification code to confirm your address.
              </AppText>
            </View>

            {/* Input Card with Container Click-to-Focus */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => emailRef.current?.focus()}
              style={[
                styles.inputCard,
                {
                  backgroundColor: isDark ? colors.surface : "#F8FAFC",
                  borderColor: isFocused ? colors.primary : colors.border,
                },
                isFocused && { backgroundColor: isDark ? colors.card : "#FFFFFF" },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isFocused ? colors.primary : colors.textMuted}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={emailRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="done"
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleNext}
                selectionColor={colors.primary}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  onPress={() => setEmail("")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <AppButton
              title="Continue"
              size="lg"
              loading={isLoading}
              disabled={!isValidEmail || isLoading}
              onPress={handleNext}
              style={styles.primaryButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
  },
  inputCard: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  inputCardFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    paddingVertical: 0,
  },
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});

