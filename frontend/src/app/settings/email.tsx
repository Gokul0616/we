import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

export default function EmailSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.email) {
        setEmail(user.email);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      await userService.updateProfile({ email: trimmed });
      setSaving(false);
      toast.success("Email address updated successfully");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to update email");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Email Address"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save email address"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <AppText weight="bold" style={{ fontSize: 16, color: "#2563EB" }}>
                Save
              </AppText>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroBox}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? "#18181B" : "#EFF6FF" }]}>
            <Ionicons name="mail-outline" size={36} color="#2563EB" />
          </View>
          <AppText weight="bold" style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Update your primary email
          </AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            We use this email to verify account access, send important security notifications, and help you reset your password.
          </AppText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText weight="semiBold" style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</AppText>
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface, fontFamily: FontFamily.regular },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  heroBox: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  saveBtn: {
    height: 50,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
