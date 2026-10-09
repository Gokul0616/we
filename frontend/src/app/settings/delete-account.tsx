import React, { useState } from "react";
import {
  View,
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
import { SettingsHeader, SettingsRadioRow, SettingsSection } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { AppButton } from "../../components/common/AppButton";

const REASONS = [
  "I want to take a break",
  "Privacy concerns",
  "Created another account",
  "Trouble getting started",
  "Too many ads or distractions",
  "Other reason",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.deleteAccount();
      setDeleting(false);
      toast.success("Account permanently deleted. We're sorry to see you go.");
      router.replace("/onboarding" as any);
    } catch (_) {
      setDeleting(false);
      await authStorage.clear();
      router.replace("/onboarding" as any);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Delete Account" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBox}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? "#450A0A" : "#FEF2F2" }]}>
            <Ionicons name="trash-outline" size={36} color="#EF4444" />
          </View>
          <AppText weight="bold" style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Are you sure you want to delete your account?
          </AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            This action is permanent and cannot be undone. All your posts, followers, likes, comments, and messages will be permanently removed.
          </AppText>
        </View>

        <SettingsSection title="Why are you deleting your account?">
          {REASONS.map((r, idx) => (
            <SettingsRadioRow
              key={r}
              title={r}
              selected={selectedReason === r}
              onSelect={() => setSelectedReason(r)}
              isLast={idx === REASONS.length - 1}
            />
          ))}
        </SettingsSection>

        <View style={{ marginTop: 28 }}>
          <AppButton
            variant="danger"
            size="lg"
            title="Permanently Delete Account"
            onPress={handleDelete}
            loading={deleting}
            disabled={deleting}
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
  deleteBtn: {
    height: 50,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  deleteBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
