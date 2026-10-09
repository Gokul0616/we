import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userService, UserUpdatePayload } from "../../services/userService";
import { authStorage } from "../../services/authStorage";
import { toast } from "../../services/toastService";
import { resolveAvatarSource, resolveCoverSource } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { AppImage } from "../../components/common/AppImage";
import { FontFamily } from "../../constants/theme";

export default function EditProfileMainScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);

  // Form State (dynamically loaded from user session)
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [socialCount, setSocialCount] = useState(0);
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");

  // Load and subscribe to user state changes across all screens
  useEffect(() => {
    const applyUser = (user: any) => {
      if (!user) return;
      if (user.full_name) setName(user.full_name);
      if (user.username) setUsername(user.username);
      if (user.bio !== undefined) setBio(user.bio);
      if (user.location !== undefined) setLocation(user.location);
      if (user.website !== undefined) setWebsite(user.website);
      if (user.avatar_url) setAvatarUri(user.avatar_url);
      if (user.cover_url) setCoverUri(user.cover_url);
      if (user.social_links) {
        const count = Object.values(user.social_links).filter(Boolean).length;
        setSocialCount(count);
      }
      if (user.privacy_settings?.visibility) {
        setVisibility(user.privacy_settings.visibility);
      }
    };

    authStorage.getUser().then(applyUser);
    userService.getProfile().then(applyUser);

    const unsubscribe = userService.subscribe(applyUser);
    return () => {
      unsubscribe();
    };
  }, []);

  // Save all changes to backend & sync engine
  const handleSaveAll = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload: UserUpdatePayload = {
        full_name: name.trim(),
        username: username.trim().replace(/^@/, ""),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
      };

      await userService.updateProfile(payload);
      setSaving(false);
      toast.success("Profile updated successfully");
      router.replace("/(tabs)/profile");
    } catch (e) {
      setSaving(false);
      console.log("Save profile error:", e);
      Alert.alert("Error", "Could not save profile. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.secondaryBg }]} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</AppText>
        <TouchableOpacity
          style={styles.headerSaveButton}
          onPress={handleSaveAll}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText weight="bold" style={[styles.headerSaveText, { color: colors.primary }]}>Save</AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Photo Banner */}
        <View style={[styles.coverContainer, { backgroundColor: colors.surface }]}>
          <AppImage source={resolveCoverSource(coverUri)} style={styles.coverImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.changeCoverBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/edit-profile/cover" as any)}
            accessibilityRole="button"
            accessibilityLabel="Change cover photo"
          >
            <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
            <AppText weight="semiBold" style={styles.changeCoverText}>Change Cover Photo</AppText>
          </TouchableOpacity>
        </View>

        {/* Circular Avatar Overlapping Cover */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatarWrapper, { borderColor: colors.background }]}>
            <AppImage source={resolveAvatarSource(avatarUri)} style={styles.avatarImage} />
            <TouchableOpacity
              style={[styles.avatarCameraBadge, { borderColor: colors.background }]}
              activeOpacity={0.85}
              onPress={() => router.push("/edit-profile/photo" as any)}
              accessibilityRole="button"
              accessibilityLabel="Change avatar photo"
            >
              <Ionicons name="camera" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Details Card */}
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Name Field */}
          <View style={styles.formGroup}>
            <AppText weight="semiBold" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</AppText>
            <TextInput
              style={[styles.fieldInput, { color: colors.textPrimary, fontFamily: FontFamily.semiBold }]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Username Field */}
          <View style={styles.formGroup}>
            <AppText weight="semiBold" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</AppText>
            <View style={styles.fieldRow}>
              <AppText weight="semiBold" style={[styles.fieldPrefix, { color: colors.textSecondary }]}>@</AppText>
              <TextInput
                style={[styles.fieldInput, { flex: 1, color: colors.textPrimary, fontFamily: FontFamily.semiBold }]}
                value={username.replace(/^@/, "")}
                onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bio Field - Navigates to dedicated Bio Screen */}
          <TouchableOpacity
            style={styles.formGroup}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile/bio" as any)}
            accessibilityRole="button"
            accessibilityLabel="Edit bio"
          >
            <View style={styles.fieldHeaderRow}>
              <AppText weight="semiBold" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bio</AppText>
              <AppText weight="medium" style={[styles.charCountText, { color: colors.textMuted }]}>{bio.length}/150</AppText>
            </View>
            <AppText weight="medium" style={[styles.bioPreviewText, { color: colors.textPrimary }]} numberOfLines={2}>
              {bio || "Tell the world about yourself..."}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Location Field - Navigates to dedicated Location Screen */}
          <TouchableOpacity
            style={styles.formRowGroup}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile/location" as any)}
            accessibilityRole="button"
            accessibilityLabel="Edit location"
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "#18181B" : "#EFF6FF" }]}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.formRowTextCol}>
              <AppText weight="semiBold" style={[styles.fieldLabel, { color: colors.textSecondary }]}>Location</AppText>
              <AppText weight="semiBold" style={[styles.formRowValue, { color: colors.textPrimary }]}>{location || "Set your location"}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Extended Navigation Options Card */}
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Profile Preview - Navigates to dedicated Preview Screen */}
          <TouchableOpacity
            style={styles.formRowGroup}
            activeOpacity={0.7}
            onPress={() => router.push("/edit-profile/preview" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open profile preview"
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "#14532D" : "#F0FDF4" }]}>
              <Ionicons name="eye-outline" size={18} color={colors.success} />
            </View>
            <View style={styles.formRowTextCol}>
              <AppText weight="semiBold" style={[styles.menuRowTitle, { color: colors.textPrimary }]}>Profile Preview</AppText>
              <AppText style={[styles.menuRowSubtitle, { color: colors.textSecondary }]}>See how others see your profile</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  coverContainer: {
    width: "100%",
    height: 160,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  changeCoverBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  changeCoverText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  avatarRow: {
    paddingHorizontal: 16,
    marginTop: -42,
    marginBottom: 12,
    zIndex: 10,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
  },
  avatarCameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#0F172A",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  formGroup: {
    paddingVertical: 6,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    paddingVertical: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldPrefix: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginRight: 2,
  },
  charCountText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  bioPreviewText: {
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 20,
    fontWeight: "500",
  },
  formRowGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  formRowTextCol: {
    flex: 1,
  },
  formRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  menuRowSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
});
