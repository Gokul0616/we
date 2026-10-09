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
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

export default function NameSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user?.full_name) {
        setName(user.full_name);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await userService.updateProfile({ full_name: trimmed });
      setSaving(false);
      toast.success("Name updated successfully");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to update name");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Name"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save name"
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
        <AppText style={[styles.instruction, { color: colors.textSecondary }]}>
          Help people discover your account by using the name you're known by: either your full name, nickname, or business name.
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText weight="semiBold" style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Display Name
          </AppText>
          <TextInput
            style={[
              styles.input,
              { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface, fontFamily: FontFamily.regular },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
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
  instruction: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
    marginHorizontal: 4,
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
