import React, { useState, useEffect } from "react";
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
import { authStorage } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { toast } from "../../services/toastService";
import { SettingsHeader } from "../../components/settings/SettingsUI";
import { CustomDatePicker } from "../../components/common/CustomDatePicker";
import { AppText } from "../../components/common/AppText";

export default function DateOfBirthScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);

  const getInitialDate = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m - 1, d);
    }
    return new Date(1995, 0, 1);
  };

  const handleDateConfirm = (date: Date) => {
    setDay(date.getDate().toString());
    setMonth((date.getMonth() + 1).toString());
    setYear(date.getFullYear().toString());
  };

  useEffect(() => {
    authStorage.getUser().then((user: any) => {
      if (user?.date_of_birth) {
        const parts = user.date_of_birth.split("/");
        if (parts.length === 3) {
          setDay(parts[0]);
          setMonth(parts[1]);
          setYear(parts[2]);
        }
      }
    });
  }, []);

  const handleSave = async () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || d < 1 || d > 31) {
      toast.error("Please enter a valid day (1-31)");
      return;
    }
    if (isNaN(m) || m < 1 || m > 12) {
      toast.error("Please enter a valid month (1-12)");
      return;
    }
    const currentYear = new Date().getFullYear();
    if (isNaN(y) || y < 1920 || y > currentYear) {
      toast.error(`Please enter a valid year (1920-${currentYear})`);
      return;
    }

    const formattedDob = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    setSaving(true);

    try {
      await userService.updateProfile({ date_of_birth: formattedDob });
      setSaving(false);
      toast.success("Date of birth updated");
      router.back();
    } catch (_) {
      setSaving(false);
      toast.error("Failed to save date of birth");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader
        title="Date of Birth"
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Save date of birth"
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
            <Ionicons name="calendar-outline" size={36} color="#2563EB" />
          </View>
          <AppText weight="bold" style={[styles.heroTitle, { color: colors.textPrimary }]}>
            When is your birthday?
          </AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Providing your birthday helps us customize your age-appropriate experience and won't be shown publicly unless you choose to.
          </AppText>
        </View>

        {/* Date Selection */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText weight="semiBold" style={[styles.inputLabel, { color: colors.textSecondary }]}>Your Birthday</AppText>
          <TouchableOpacity
            style={[styles.dateDisplayBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select your date of birth"
          >
            <AppText weight="medium" style={[styles.dateDisplayText, { color: day && month && year ? colors.textPrimary : colors.textMuted }]}>
              {day && month && year ? `${day.padStart(2, "0")} / ${month.padStart(2, "0")} / ${year}` : "Select your date of birth"}
            </AppText>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <CustomDatePicker
          visible={isPickerVisible}
          onClose={() => setPickerVisible(false)}
          onConfirm={handleDateConfirm}
          initialDate={getInitialDate()}
        />
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
    padding: 18,
    marginBottom: 28,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dateDisplayBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: "500",
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
