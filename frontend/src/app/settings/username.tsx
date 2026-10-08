import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { apiClient } from "../../services/apiClient";
import { ENDPOINTS } from "../../constants/api";
import { toast } from "../../services/toastService";
import { SettingsHeader } from "../../components/settings/SettingsUI";

export default function UsernameSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [initialUsername, setInitialUsername] = useState("");
  const [username, setUsername] = useState("");
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{
    loading?: boolean;
    available?: boolean;
    exists?: boolean;
    message?: string;
  } | null>(null);

  const usernameRef = useRef<TextInput>(null);
  const checkTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await authStorage.getUser();
      if (user?.username) {
        setInitialUsername(user.username);
        setUsername(user.username);
      }
      try {
        const profile = await userService.getProfile();
        if (profile?.username) {
          setInitialUsername(profile.username);
          setUsername(profile.username);
        }
      } catch (_) {}
    };
    loadUser();

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const clean = username.trim().toLowerCase();
  const isCurrent = clean.length > 0 && clean === initialUsername.toLowerCase();
  const isTooShort = clean.length > 0 && clean.length < 5;
  const isTooLong = clean.length > 18;
  const isUsernameTaken = !isCurrent && usernameCheck?.exists === true;
  const isUsernameAvailable =
    !isCurrent && usernameCheck?.available === true && !isTooShort && !isTooLong;

  const canSave =
    !isCurrent &&
    clean.length >= 5 &&
    clean.length <= 18 &&
    isUsernameAvailable &&
    !usernameCheck?.loading &&
    !saving;

  const handleUsernameChange = (raw: string) => {
    const sanitized = raw.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 25);
    setUsername(sanitized);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (sanitized === initialUsername.toLowerCase()) {
      setUsernameCheck(null);
      return;
    }

    if (sanitized.length < 5 || sanitized.length > 18) {
      setUsernameCheck(null);
      return;
    }

    setUsernameCheck({ loading: true });

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await userService.checkUsername(sanitized);
        setUsernameCheck(res);
      } catch (err: any) {
        setUsernameCheck(null);
        if (err?.message) {
          toast.error(err.message);
        }
      }
    }, 300);
  };

  const handleSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    setSaving(true);

    try {
      await userService.updateProfile({ username: clean });
      setSaving(false);
      toast.success("Username updated successfully");
      router.back();
    } catch (err: any) {
      setSaving(false);
      toast.error(err?.message || "Failed to update username");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Username"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ opacity: canSave ? 1 : 0.35 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          You'll be able to change your username back at any time if it hasn't been claimed by someone else. Usernames can only contain letters, numbers, and underscores.
        </Text>

        {/* Input Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor:
                isUsernameTaken || isTooLong || (isTooShort && clean.length > 0)
                  ? "#EF4444"
                  : isUsernameAvailable
                  ? "#10B981"
                  : focused
                  ? colors.primary
                  : colors.border,
            },
          ]}
        >
          <View style={styles.labelRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Username
            </Text>
            <Text
              style={[
                styles.charCounter,
                { color: isTooLong || (isTooShort && clean.length > 0) ? "#EF4444" : colors.textMuted },
              ]}
            >
              {clean.length}/18
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.atPrefix, { color: colors.textSecondary }]}>@</Text>
            <TextInput
              ref={usernameRef}
              style={[styles.input, { color: colors.textPrimary }]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={25}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Status indicator icon */}
            {usernameCheck?.loading ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 4 }} />
            ) : isUsernameTaken || isTooLong || (isTooShort && clean.length > 0) ? (
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            ) : isUsernameAvailable ? (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            ) : isCurrent ? (
              <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
            ) : clean.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setUsername("");
                  setUsernameCheck(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Dynamic feedback message row */}
        {isCurrent ? (
          <View style={styles.feedbackRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.feedbackCurrent, { color: colors.textSecondary }]}>
              This is your current username.
            </Text>
          </View>
        ) : isTooLong ? (
          <View style={styles.feedbackRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.feedbackError}>
              Username cannot exceed 18 characters.
            </Text>
          </View>
        ) : isTooShort ? (
          <View style={styles.feedbackRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.feedbackError}>
              Username must be at least 5 characters.
            </Text>
          </View>
        ) : isUsernameTaken ? (
          <View style={styles.feedbackRow}>
            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.feedbackError}>
              A user with that username already exists.
            </Text>
          </View>
        ) : isUsernameAvailable ? (
          <View style={styles.feedbackRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.feedbackSuccess}>
              @{clean} is available.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  charCounter: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  atPrefix: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingVertical: 0,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 6,
    marginTop: 4,
  },
  feedbackCurrent: {
    fontSize: 13,
    fontWeight: "500",
  },
  feedbackError: {
    fontSize: 13,
    fontWeight: "500",
    color: "#EF4444",
  },
  feedbackSuccess: {
    fontSize: 13,
    fontWeight: "500",
    color: "#10B981",
  },
});
