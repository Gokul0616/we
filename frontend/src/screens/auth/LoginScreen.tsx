import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WeLogo } from "../../components/WeLogo";
import { Colors, FontFamily } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";
import { authStorage } from "../../services/authStorage";
import { AppText } from "../../components/common/AppText";
import { AppButton } from "../../components/common/AppButton";
import { useTheme } from "../../context/ThemeContext";

interface LoginScreenProps {
  onSuccess: (userData: any) => void;
  onGoToSignUp: () => void;
  onBack: () => void;
}

export function LoginScreen({ onSuccess, onGoToSignUp, onBack }: LoginScreenProps) {
  const { colors, isDark } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"identifier" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const identifierRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isValid = identifier.trim().length >= 3 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || isLoading) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const cleanIdentifier = identifier.trim().toLowerCase().replace(/^@/, "");
      const data = await apiClient.post(
        ENDPOINTS.auth.login,
        {
          email: cleanIdentifier,
          username: cleanIdentifier,
          login: cleanIdentifier,
          password,
        },
        { skipUnauthorizedHandler: true }
      );

      if (data?.access_token) {
        await authStorage.saveToken(data.access_token);
        if (data.user) {
          await authStorage.saveUser(data.user);
        }
        apiClient.setAuthToken(data.access_token);
        onSuccess(data);
      }
    } catch (err: any) {
      // Toast notification is automatically shown by apiClient interceptor.
      // Do not proceed next if an error occurs.
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
            <View style={styles.brandHeader}>
              <WeLogo size="md" color={colors.textPrimary} />
              <AppText variant="screenTitle" style={[styles.title, { color: colors.textPrimary }]}>
                Welcome back
              </AppText>
              <AppText variant="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to continue to your community.
              </AppText>
            </View>

            <View style={styles.form}>
              {/* Email or Username Field with Container Click-to-Focus */}
              <View style={styles.field}>
                <AppText variant="label" style={[styles.label, { color: colors.textPrimary }]}>
                  Email or Username
                </AppText>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => identifierRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    {
                      backgroundColor: isDark ? colors.surface : "#F8FAFC",
                      borderColor: focusedField === "identifier" ? colors.primary : colors.border,
                    },
                    focusedField === "identifier" && { backgroundColor: isDark ? colors.card : "#FFFFFF" },
                  ]}
                >
                  <TextInput
                    ref={identifierRef}
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="username or email"
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setFocusedField("identifier")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    selectionColor={colors.primary}
                  />
                  {identifier.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setIdentifier("")}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Field with Container Click-to-Focus */}
              <View style={styles.field}>
                <AppText variant="label" style={[styles.label, { color: colors.textPrimary }]}>
                  Password
                </AppText>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => passwordRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    {
                      backgroundColor: isDark ? colors.surface : "#F8FAFC",
                      borderColor: focusedField === "password" ? colors.primary : colors.border,
                    },
                    focusedField === "password" && { backgroundColor: isDark ? colors.card : "#FFFFFF" },
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { flex: 1, color: colors.textPrimary }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={handleLogin}
                    selectionColor={colors.primary}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>

            <AppButton
              title="Log In"
              size="lg"
              loading={isLoading}
              disabled={!isValid || isLoading}
              onPress={handleLogin}
              style={styles.primaryButton}
            />

            <View style={styles.footerRow}>
              <AppText variant="bodySmall" style={[styles.footerText, { color: colors.textSecondary }]}>
                {"Don't have an account? "}
              </AppText>
              <TouchableOpacity activeOpacity={0.7} onPress={onGoToSignUp}>
                <AppText variant="bodySmall" weight="bold" style={[styles.footerLink, { color: colors.primary }]}>
                  Sign Up
                </AppText>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginTop: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14.5,
    color: "#64748B",
  },
  form: {
    gap: 16,
    marginBottom: 26,
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#334155",
  },
  inputCard: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputCardFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 15,
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
    marginBottom: 20,
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
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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

