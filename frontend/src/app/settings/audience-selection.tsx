import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "../../services/toastService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRadioRow,
} from "../../components/settings/SettingsUI";
import { AppText } from "../../components/common/AppText";

const OPTIONS = [
  { id: "Everyone", label: "Everyone", description: "Anyone on WE can interact" },
  { id: "People You Follow", label: "People You Follow", description: "Only accounts you follow" },
  { id: "Followers", label: "Your Followers", description: "People who follow your profile" },
  { id: "No One", label: "No One", description: "Turn off this interaction" },
];

export default function AudienceSelectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ title?: string; current?: string; key?: string }>();

  const title = params.title || "Audience";
  const [selected, setSelected] = useState(params.current || "Everyone");

  const handleSave = () => {
    toast.success(`${title} set to ${selected}`);
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title={title}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save audience selection"
          >
            <AppText weight="bold" style={{ fontSize: 16, color: "#2563EB" }}>
              Save
            </AppText>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Who can interact">
          {OPTIONS.map((opt, index) => (
            <SettingsRadioRow
              key={opt.id}
              title={opt.label}
              subtitle={opt.description}
              selected={selected === opt.id}
              onSelect={() => setSelected(opt.id)}
              isLast={index === OPTIONS.length - 1}
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
});
