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
import { toast } from "../../services/toastService";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

export default function PhoneSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.phone) {
        const raw = user.phone.trim();
        if (raw.startsWith("+")) {
          const parts = raw.split(" ");
          if (parts.length > 1) {
            setCountryCode(parts[0]);
            setPhone(parts.slice(1).join(""));
          } else {
            setPhone(raw);
          }
        } else {
          setPhone(raw);
        }
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = phone.trim().replace(/\D/g, "");
    if (trimmed.length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const fullPhone = `${countryCode} ${trimmed}`;
    setSaving(true);
    try {
      await userService.updateProfile({ phone: fullPhone });
      setSaving(false);
      toast.success("Phone number updated successfully");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to update phone number");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Phone Number"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save phone number"
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
            <Ionicons name="call-outline" size={36} color="#2563EB" />
          </View>
          <AppText weight="bold" style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Add or update mobile number
          </AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Your phone number helps secure your account via SMS two-factor verification and makes account recovery easier.
          </AppText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText weight="semiBold" style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Number</AppText>
          <View style={styles.phoneInputRow}>
            <View
              style={[
                styles.countryCodeBadge,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.countryCodeInput, { color: colors.textPrimary, fontFamily: FontFamily.semiBold }]}
                value={countryCode}
                onChangeText={setCountryCode}
                keyboardType="phone-pad"
                maxLength={4}
              />
            </View>
            <TextInput
              style={[
                styles.phoneInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface, fontFamily: FontFamily.regular },
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="1234567890"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
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
  phoneInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryCodeBadge: {
    width: 64,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeInput: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  phoneInput: {
    flex: 1,
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
