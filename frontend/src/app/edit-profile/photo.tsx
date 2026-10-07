import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { userService } from "../../services/userService";
import { authStorage } from "../../services/authStorage";
import { toast } from "../../services/toastService";
import { resolveAvatarSource, PRESET_AVATAR_MAP } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRESET_AVATARS = [
  { id: "asset:onboarding_hero.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_hero.jpg"] },
  { id: "asset:onboarding_slide_2.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_slide_2.jpg"] },
  { id: "asset:onboarding_slide_3.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_slide_3.jpg"] },
  { id: "asset:onboarding_slide_4.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_slide_4.jpg"] },
  { id: "asset:explore_food.jpg", source: PRESET_AVATAR_MAP["asset:explore_food.jpg"] },
];

export default function ChangeProfilePhotoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>("");
  const [avatarTab, setAvatarTab] = useState<"gallery" | "camera" | "remove">("gallery");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.avatar_url) {
        setCurrentAvatar(u.avatar_url);
      }
    });
  }, []);

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Needed", "Please allow gallery access to select a profile photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setCurrentAvatar(res.assets[0].uri);
      }
    } catch (e) {
      console.warn("pickFromGallery error:", e);
    }
  };

  const takeWithCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Needed", "Please allow camera access to take a profile photo.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setCurrentAvatar(res.assets[0].uri);
      }
    } catch (e) {
      console.warn("takeWithCamera error:", e);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let finalAvatarUrl = currentAvatar;
      if (currentAvatar && !currentAvatar.startsWith("http://") && !currentAvatar.startsWith("https://") && !currentAvatar.startsWith("asset:")) {
        finalAvatarUrl = await userService.uploadImage(currentAvatar, "avatar");
      }

      await userService.updateProfile({
        avatar_url: finalAvatarUrl,
      });
      setSaving(false);
      toast.success("Profile photo updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save avatar error:", e);
      Alert.alert("Error", "Failed to update profile photo.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Change Profile Photo</Text>
        <TouchableOpacity style={styles.headerSaveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.headerSaveText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Large Avatar Preview */}
        <View style={styles.centerPreviewContainer}>
          <View style={[styles.largeAvatarWrapper, { backgroundColor: colors.surface }]}>
            <Image source={resolveAvatarSource(currentAvatar)} style={styles.largeAvatar} />
            <TouchableOpacity
              style={[
                styles.largeAvatarCameraBadge,
                { backgroundColor: colors.surface, borderColor: colors.background },
              ]}
              activeOpacity={0.8}
              onPress={takeWithCamera}
            >
              <Ionicons name="camera" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: Gallery | Camera | Remove */}
        <View style={[styles.segmentedTabContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              avatarTab === "gallery" && [
                styles.segmentBtnActive,
                { backgroundColor: isDark ? colors.surfaceHighlight : "#FFFFFF" },
              ],
            ]}
            onPress={() => {
              setAvatarTab("gallery");
              pickFromGallery();
            }}
          >
            <Ionicons
              name="images-outline"
              size={16}
              color={avatarTab === "gallery" ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: colors.textSecondary },
                avatarTab === "gallery" && { color: colors.primary, fontWeight: "700" },
              ]}
            >
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              avatarTab === "camera" && [
                styles.segmentBtnActive,
                { backgroundColor: isDark ? colors.surfaceHighlight : "#FFFFFF" },
              ],
            ]}
            onPress={() => {
              setAvatarTab("camera");
              takeWithCamera();
            }}
          >
            <Ionicons
              name="camera-outline"
              size={16}
              color={avatarTab === "camera" ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: colors.textSecondary },
                avatarTab === "camera" && { color: colors.primary, fontWeight: "700" },
              ]}
            >
              Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              avatarTab === "remove" && [
                styles.segmentBtnActive,
                { backgroundColor: isDark ? colors.surfaceHighlight : "#FFFFFF" },
              ],
            ]}
            onPress={() => {
              setAvatarTab("remove");
              setCurrentAvatar("");
            }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={avatarTab === "remove" ? "#EF4444" : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: colors.textSecondary },
                avatarTab === "remove" && { color: "#EF4444", fontWeight: "700" },
              ]}
            >
              Remove
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3-Column Media Grid */}
        <View style={styles.photoGrid}>
          {PRESET_AVATARS.map((item) => {
            const isSelected = currentAvatar === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.photoGridItem,
                  { backgroundColor: colors.surface },
                  isSelected && styles.photoGridItemSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setCurrentAvatar(item.id)}
              >
                <Image source={item.source} style={styles.photoGridImage} />
                {isSelected && (
                  <View style={styles.gridCheckBadge}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.helperNoticeText, { color: colors.textSecondary }]}>High quality photos work best. Keep it real.</Text>
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
  centerPreviewContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  largeAvatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E2E8F0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  largeAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  largeAvatarCameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  segmentedTabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#2563EB",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - 28 - 20) / 3,
    height: (SCREEN_WIDTH - 28 - 20) / 3,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  photoGridItemSelected: {
    borderColor: "#2563EB",
  },
  photoGridImage: {
    width: "100%",
    height: "100%",
  },
  gridCheckBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#2563EB",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  helperNoticeText: {
    textAlign: "center",
    fontSize: 13,
    color: "#94A3B8",
    marginHorizontal: 30,
    marginTop: 8,
  },
});
