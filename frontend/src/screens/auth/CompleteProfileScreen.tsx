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
import { Colors } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";
import { toast } from "../../services/toastService";

interface CompleteProfileScreenProps {
  email: string;
  onCompleted: (userData: any) => void;
  onBack: () => void;
}

export function CompleteProfileScreen({
  email,
  onCompleted,
  onBack,
}: CompleteProfileScreenProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"fullName" | "username" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{
    loading?: boolean;
    available?: boolean;
    exists?: boolean;
    message?: string;
    user?: { username: string; full_name?: string; avatar_url?: string };
  } | null>(null);

  const fullNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const checkTimeoutRef = useRef<any>(null);

  const isTooShort = username.length > 0 && username.length < 5;
  const isTooLong = username.length > 18;
  const isUsernameTaken = usernameCheck?.exists === true;
  const isUsernameAvailable = usernameCheck?.available === true && !isTooShort && !isTooLong;

  const isValid =
    fullName.trim().length >= 2 &&
    username.trim().length >= 5 &&
    username.trim().length <= 18 &&
    !isUsernameTaken &&
    !isTooShort &&
    !isTooLong &&
    !usernameCheck?.loading &&
    password.length >= 6;

  const handleUsernameChange = (raw: string) => {
    // Allow typing slightly beyond 18 (up to 25) so user sees the "cannot exceed 18" message
    const clean = raw.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 25);
    setUsername(clean);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (clean.length < 5 || clean.length > 18) {
      setUsernameCheck(null);
      return;
    }

    setUsernameCheck({ loading: true });

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.auth.checkUsername(clean));
        setUsernameCheck(res);
      } catch (err: any) {
        setUsernameCheck(null);
        if (err?.message) {
          toast.error(err.message);
        }
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const data = await apiClient.post(ENDPOINTS.auth.register, {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      });

      if (data?.access_token) {
        apiClient.setAuthToken(data.access_token);
        onCompleted(data);
      }
    } catch (err: any) {
      // Toast notification is automatically shown by apiClient interceptor.
      // Do not proceed next if registration fails.
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
            <View style={styles.header}>
              <Text style={styles.title}>Create your profile</Text>
              <Text style={styles.subtitle}>
                Choose your handle and set up your account.
              </Text>
            </View>

            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => fullNameRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    focusedField === "fullName" && styles.inputCardFocused,
                  ]}
                >
                  <TextInput
                    ref={fullNameRef}
                    style={styles.input}
                    placeholder="e.g. Gokul Ssb"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="name"
                    returnKeyType="next"
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    selectionColor={Colors.primary}
                  />
                  {fullName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setFullName("")}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Username */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Username</Text>
                  <Text
                    style={[
                      styles.charCounter,
                      (isTooLong || (isTooShort && username.length > 0)) && styles.charCounterError,
                    ]}
                  >
                    {username.length}/18
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => usernameRef.current?.focus()}
                  style={[
                    styles.inputCard,
                    focusedField === "username" && styles.inputCardFocused,
                    (isUsernameTaken || isTooLong || isTooShort) && styles.inputCardError,
                    isUsernameAvailable && styles.inputCardSuccess,
                  ]}
                >
                  <Text style={styles.atPrefix}>@</Text>
                  <TextInput
                    ref={usernameRef}
                    style={[styles.input, { flex: 1 }]}
                    placeholder="username"
                    placeholderTextColor="#94A3B8"
                    value={username}
                    maxLength={25}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    returnKeyType="next"
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    selectionColor={Colors.primary}
                  />

                  {/* Status Indicator Icon right inside input */}
                  {usernameCheck?.loading ? (
                    <ActivityIndicator size="small" color="#94A3B8" style={{ marginRight: 4 }} />
                  ) : isUsernameTaken || isTooLong || isTooShort ? (
                    <Ionicons name="close-circle" size={20} color="#ED4956" />
                  ) : isUsernameAvailable ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : username.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        setUsername("");
                        setUsernameCheck(null);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>

                {/* Instagram-style Dynamic Feedback Message */}
                {isTooLong ? (
                  <View style={styles.igFeedbackRow}>
                    <Text style={styles.igTakenMessage}>
                      Username cannot exceed 18 characters.
                    </Text>
                  </View>
                ) : isTooShort ? (
                  <View style={styles.igFeedbackRow}>
                    <Text style={styles.igTakenMessage}>
                      Username must be at least 5 characters.
                    </Text>
                  </View>
                ) : usernameCheck?.exists ? (
                  <View style={styles.igFeedbackRow}>
                    <Text style={styles.igTakenMessage}>
                      A user with that username already exists.
                    </Text>
                  </View>
                ) : isUsernameAvailable ? (
                  <View style={styles.igFeedbackRow}>
                    <Text style={styles.igAvailableMessage}>
                      @{username} is available.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.igFeedbackRow}>
                    <Text style={styles.igHelperText}>
                      Username must be 5 to 18 letters, numbers, or underscores.
                    </Text>
                  </View>
                )}
              </View>

              {/* Password */}
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
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="done"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={handleSubmit}
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
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
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
    paddingTop: 20,
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
  form: {
    gap: 16,
    marginBottom: 28,
  },
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#334155",
  },
  charCounter: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#94A3B8",
  },
  charCounterError: {
    color: "#ED4956",
    fontWeight: "700",
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
  inputCardError: {
    borderColor: "#ED4956",
    backgroundColor: "#FFF8F8",
  },
  inputCardSuccess: {
    borderColor: "#10B981",
    backgroundColor: "#F6FDF9",
  },
  igFeedbackRow: {
    marginTop: 5,
    paddingHorizontal: 4,
  },
  igTakenMessage: {
    fontSize: 12.5,
    color: "#ED4956",
    fontWeight: "500",
    lineHeight: 16,
  },
  igAvailableMessage: {
    fontSize: 12.5,
    color: "#10B981",
    fontWeight: "600",
    lineHeight: 16,
  },
  igHelperText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  atPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginRight: 6,
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
