import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRadioRow,
} from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";

const GENDER_OPTIONS = [
  { id: "Female", label: "Female", desc: "She / Her" },
  { id: "Male", label: "Male", desc: "He / Him" },
  { id: "Non-binary", label: "Non-binary", desc: "They / Them" },
  { id: "Custom", label: "Custom", desc: "Specify custom pronouns" },
  { id: "Prefer not to say", label: "Prefer not to say", desc: "Keep private" },
];

export default function GenderSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedGender, setSelectedGender] = useState("Prefer not to say");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authStorage.getUser().then((user: any) => {
      if (user?.gender) {
        setSelectedGender(user.gender);
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({ gender: selectedGender });
      setSaving(false);
      toast.success("Gender updated successfully");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to update gender");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Gender"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save gender"
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
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.instruction, { color: colors.textSecondary }]}>
          This won't be part of your public profile unless you choose to display it.
        </AppText>

        <SettingsSection title="Select Your Gender">
          {GENDER_OPTIONS.map((g, index) => (
            <SettingsRadioRow
              key={g.id}
              title={g.label}
              subtitle={g.desc}
              selected={selectedGender === g.id}
              onSelect={() => setSelectedGender(g.id)}
              isLast={index === GENDER_OPTIONS.length - 1}
            />
          ))}
        </SettingsSection>
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
    paddingBottom: 36,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 4,
    marginHorizontal: 20,
  },
});
