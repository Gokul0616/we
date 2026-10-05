import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
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
import { Colors } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";

interface LoginScreenProps {
  onSuccess: (userData: any) => void;
  onGoToSignUp: () => void;
  onBack: () => void;
}

export function LoginScreen({ onSuccess, onGoToSignUp, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isValid = email.includes("@") && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || isLoading) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const data = await apiClient.post(ENDPOINTS.auth.login, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (data?.access_token) {
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
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Bar */}
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
              <WeLogo size="md" color="#1E293B" />
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue to your community.
              </Text>
            </View>

            <View style={styles.form}>
              {/* Email Field with Container Click-to-Focus */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => emailRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    focusedField === "email" && styles.inputCardFocused,
                  ]}
                >
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    selectionColor={Colors.primary}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEmail("")}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Field with Container Click-to-Focus */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => passwordRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    focusedField === "password" && styles.inputCardFocused,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
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
                    selectionColor={Colors.primary}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isValid || isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={onGoToSignUp}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
    color: "#0F172A",
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

