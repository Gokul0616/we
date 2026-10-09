import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userService } from "../../services/userService";
import { authStorage } from "../../services/authStorage";
import { toast } from "../../services/toastService";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { FontFamily } from "../../constants/theme";

const SUGGESTED_LOCATIONS = [
  "Bangalore, India",
  "Mumbai, Maharashtra",
  "New Delhi, Delhi",
  "Hyderabad, Telangana",
  "Chennai, Tamil Nadu",
  "Goa, India",
  "San Francisco, USA",
  "London, UK",
  "Tokyo, Japan",
  "Singapore",
];

export default function EditLocationScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.location !== undefined) {
        setLocation(u.location);
      }
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await userService.updateProfile({
        location: location.trim(),
      });
      setSaving(false);
      toast.success("Location updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save location error:", e);
      Alert.alert("Error", "Failed to update location.");
    }
  };

  const filtered = SUGGESTED_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Location</AppText>
        <TouchableOpacity
          style={styles.headerSaveButton}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save location"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText weight="bold" style={[styles.headerSaveText, { color: colors.primary }]}>Save</AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Input */}
        <View style={[styles.searchLocationBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchLocationInput, { color: colors.textPrimary, fontFamily: FontFamily.regular }]}
            placeholder="Search location..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Active Selected Location Chip */}
        {location ? (
          <View
            style={[
              styles.activeLocationChip,
              {
                backgroundColor: isDark ? colors.surface : "#EFF6FF",
                borderColor: isDark ? colors.border : "#BFDBFE",
              },
            ]}
          >
            <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <AppText weight="semiBold" style={[styles.activeLocationText, { color: colors.primary }]}>{location}</AppText>
            <TouchableOpacity
              onPress={() => setLocation("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Remove selected location"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Suggested Locations */}
        <AppText weight="bold" style={[styles.sectionHeading, { color: colors.textPrimary }]}>Suggested Locations</AppText>
        <View style={[styles.locationListCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {filtered.map((loc, idx) => {
            const isSelected = location.toLowerCase() === loc.toLowerCase();
            return (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationRowItem,
                  idx < filtered.length - 1 && [styles.locationBorder, { borderBottomColor: colors.border }],
                ]}
                activeOpacity={0.7}
                onPress={() => setLocation(loc)}
                accessibilityRole="button"
                accessibilityLabel={loc}
              >
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <AppText weight="medium" style={[styles.locationItemText, { color: colors.textPrimary }]}>{loc}</AppText>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchLocationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchLocationInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
  activeLocationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  activeLocationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  locationListCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  locationRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  locationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  locationItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
});
