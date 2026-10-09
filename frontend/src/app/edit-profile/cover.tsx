import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
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
import { resolveCoverSource, PRESET_COVER_MAP } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { AppImage } from "../../components/common/AppImage";

const PRESET_COVERS = [
  { id: "asset:cinque_terre_post.jpg", source: PRESET_COVER_MAP["asset:cinque_terre_post.jpg"] },
  { id: "asset:home_feed_bali_post.jpg", source: PRESET_COVER_MAP["asset:home_feed_bali_post.jpg"] },
  { id: "asset:explore_santorini.jpg", source: PRESET_COVER_MAP["asset:explore_santorini.jpg"] },
  { id: "asset:splash_mountain.jpg", source: PRESET_COVER_MAP["asset:splash_mountain.jpg"] },
];

export default function ChangeCoverPhotoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [currentCover, setCurrentCover] = useState<string>("asset:cinque_terre_post.jpg");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.cover_url) {
        setCurrentCover(u.cover_url);
      }
    });
  }, []);

  const pickCoverFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Needed", "Please allow gallery access to select a cover photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setCurrentCover(res.assets[0].uri);
      }
    } catch (e) {
      console.log("pickCoverFromGallery error:", e);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let finalCoverUrl = currentCover;
      if (currentCover && !currentCover.startsWith("http://") && !currentCover.startsWith("https://") && !currentCover.startsWith("asset:")) {
        finalCoverUrl = await userService.uploadImage(currentCover, "cover");
      }

      await userService.updateProfile({
        cover_url: finalCoverUrl,
      });
      setSaving(false);
      toast.success("Cover photo updated successfully");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save cover error:", e);
      Alert.alert("Error", "Failed to update cover photo.");
    }
  };

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
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>Change Cover Photo</AppText>
        <TouchableOpacity
          style={styles.headerSaveButton}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save cover photo"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText weight="bold" style={[styles.headerSaveText, { color: colors.primary }]}>Save</AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Viewport with Crop Brackets */}
        <View style={styles.coverViewport}>
          <AppImage source={resolveCoverSource(currentCover)} style={styles.coverViewportImage} resizeMode="cover" />
          <View style={styles.cropBracketTL} />
          <View style={styles.cropBracketTR} />
          <View style={styles.cropBracketBL} />
          <View style={styles.cropBracketBR} />
        </View>
        <AppText style={[styles.coverDragHint, { color: colors.textSecondary }]}>Drag to adjust your cover photo</AppText>

        {/* Suggested Presets Section */}
        <AppText weight="bold" style={[styles.sectionHeading, { color: colors.textPrimary }]}>Suggested</AppText>
        <View style={styles.suggestedCoverRow}>
          {PRESET_COVERS.map((preset) => {
            const isSelected = currentCover === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.suggestedCoverCard,
                  { backgroundColor: colors.surface },
                  isSelected && styles.suggestedCoverCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setCurrentCover(preset.id)}
                accessibilityRole="button"
                accessibilityLabel="Select suggested cover"
              >
                <Image source={preset.source} style={styles.suggestedCoverThumb} />
                {isSelected && (
                  <View style={styles.suggestedCoverBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[
            styles.actionBtnOutline,
            {
              backgroundColor: isDark ? colors.surface : "#EFF6FF",
              borderColor: isDark ? colors.border : "#BFDBFE",
            },
          ]}
          activeOpacity={0.8}
          onPress={pickCoverFromGallery}
          accessibilityRole="button"
          accessibilityLabel="Choose cover from gallery"
        >
          <Ionicons name="images-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <AppText weight="semiBold" style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Choose from Gallery</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtnDangerOutline,
            {
              backgroundColor: isDark ? colors.surface : "#FEF2F2",
              borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
            },
          ]}
          activeOpacity={0.8}
          onPress={() => setCurrentCover("asset:cinque_terre_post.jpg")}
          accessibilityRole="button"
          accessibilityLabel="Remove cover photo"
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <AppText weight="semiBold" style={styles.actionBtnDangerOutlineText}>Remove Cover Photo</AppText>
        </TouchableOpacity>
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
  coverViewport: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E293B",
    position: "relative",
  },
  coverViewportImage: {
    width: "100%",
    height: "100%",
  },
  cropBracketTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#FFFFFF",
  },
  cropBracketTR: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#FFFFFF",
  },
  cropBracketBL: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#FFFFFF",
  },
  cropBracketBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#FFFFFF",
  },
  coverDragHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  suggestedCoverRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  suggestedCoverCard: {
    flex: 1,
    height: 68,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  suggestedCoverCardActive: {
    borderColor: "#2563EB",
  },
  suggestedCoverThumb: {
    width: "100%",
    height: "100%",
  },
  suggestedCoverBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#2563EB",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    marginBottom: 12,
  },
  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  actionBtnDangerOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  actionBtnDangerOutlineText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
});
