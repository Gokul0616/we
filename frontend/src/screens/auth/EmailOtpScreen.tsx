import React, { useState, useRef, useEffect } from "react";
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
import { Colors, FontFamily } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";
import { AppText } from "../../components/common/AppText";
import { AppButton } from "../../components/common/AppButton";
import { useTheme } from "../../context/ThemeContext";

interface EmailOtpScreenProps {
  email: string;
  onVerified: (otp: string) => void;
  onBack: () => void;
  onResendOtp: () => void;
}

export function EmailOtpScreen({
  email,
  onVerified,
  onBack,
  onResendOtp,
}: EmailOtpScreenProps) {
  const { colors, isDark } = useTheme();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyCode = async (code: string) => {
    const cleanCode = (code || "").trim();
    if (cleanCode.length !== 6 || isVerifying) return;

    Keyboard.dismiss();
    setIsVerifying(true);
    setError(null);

    try {
      const res = await apiClient.post(ENDPOINTS.auth.verifyOtp, {
        email: (email || "").trim().toLowerCase(),
        code: cleanCode,
      });

      if (res?.verified) {
        onVerified(cleanCode);
      } else {
        setError(res?.message || "Invalid verification code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      console.log("Verify OTP API error:", err);
      setError(err?.message || "Verification request failed. Please check connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setTimer(60);
    setError(null);
    try {
      await apiClient.post(ENDPOINTS.auth.sendOtp, {
        email: (email || "").trim().toLowerCase(),
      });
    } catch (err: any) {
      console.log("Resend OTP error:", err);
      setError(err?.message || "Failed to resend code.");
    }
    onResendOtp();
  };

  const handleChange = (text: string, index: number) => {
    if (error) setError(null);
    const digitsOnly = text.replace(/[^0-9]/g, "");

    if (digitsOnly.length > 1) {
      // User pasted multiple digits
      const digits = digitsOnly.slice(0, 6).split("");
      const newOtp = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      inputs.current[nextIdx]?.focus();
      if (digits.length === 6) {
        verifyCode(digits.join(""));
      }
      return;
    }

    const char = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-focus next input
    if (char && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify as soon as all 6 digits are typed
    const fullCode = newOtp.join("");
    if (fullCode.length === 6 && newOtp.every((d) => d.length === 1)) {
      verifyCode(fullCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (error) setError(null);
    if (e.nativeEvent.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const isComplete = otp.every((d) => d.length === 1);

  const handleSubmit = () => {
    const fullCode = otp.join("");
    if (fullCode.length !== 6 || isVerifying) return;
    verifyCode(fullCode);
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
                Verify your email
              </AppText>
              <AppText variant="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
                {"Enter the 6-digit verification code sent to\n"}
                <AppText variant="body" weight="bold" style={[styles.emailHighlight, { color: colors.textPrimary }]}>
                  {email || "your email"}
                </AppText>
              </AppText>
            </View>

            {/* 6 OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = Boolean(digit);
                const hasError = Boolean(error);

                return (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: isDark ? colors.surface : "#F8FAFC",
                        borderColor: isFocused ? colors.primary : colors.border,
                        color: colors.textPrimary,
                      },
                      isFilled && {
                        backgroundColor: isDark ? colors.card : "#FFFFFF",
                        borderColor: isFocused ? colors.primary : (isDark ? colors.borderLight : "#CBD5E1"),
                      },
                      hasError && styles.otpInputError,
                    ]}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    maxLength={6}
                    value={digit}
                    onChangeText={(t) => handleChange(t, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    autoFocus={index === 0}
                    selectTextOnFocus
                    selectionColor={colors.primary}
                  />
                );
              })}
            </View>

            {/* Error Message Feedback */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={styles.errorIcon} />
                <AppText variant="caption" weight="semibold" style={styles.errorText}>
                  {error}
                </AppText>
              </View>
            ) : null}

            {/* Resend Code Prompt */}
            <View style={styles.resendRow}>
              <AppText variant="bodySmall" style={[styles.resendPrompt, { color: colors.textSecondary }]}>
                {"Didn't receive the code? "}
              </AppText>
              {timer > 0 ? (
                <AppText variant="bodySmall" weight="semibold" style={styles.timerText}>
                  Resend in {timer}s
                </AppText>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <AppText variant="bodySmall" weight="bold" style={[styles.resendLink, { color: colors.primary }]}>
                    Resend Code
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <AppButton
              title="Verify & Continue"
              size="lg"
              loading={isVerifying}
              disabled={!isComplete || isVerifying}
              onPress={handleSubmit}
              style={styles.verifyButton}
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
    marginBottom: 32,
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
  emailHighlight: {
    color: "#0F172A",
    fontWeight: "700",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    textAlign: "center",
    fontSize: 24,
    fontFamily: FontFamily.extraBold,
    color: "#0F172A",
  },
  otpInputFilled: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  otpInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
  },
  otpInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
    flexShrink: 1,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  resendPrompt: {
    fontSize: 14,
    color: "#64748B",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    opacity: 0.45,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
