import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { resolveAvatarSource } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../../components/common/AppText";
import { AppImage } from "../../components/common/AppImage";

export default function ChangeProfilePhotoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [initialAvatar, setInitialAvatar] = useState<string>("");
  const [currentAvatar, setCurrentAvatar] = useState<string>("");

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u) {
        const avatar = u.avatar_url || "asset:default_avatar.png";
        setInitialAvatar(avatar);
        setCurrentAvatar(avatar);
      }
    });
  }, []);

  const hasChanges = currentAvatar !== initialAvatar;

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
      console.log("pickFromGallery error:", e);
      toast.error("Failed to open gallery");
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
      console.log("takeWithCamera error:", e);
      toast.error("Failed to open camera");
    }
  };

  const handleRemovePhoto = () => {
    setCurrentAvatar("asset:default_avatar.png");
  };

  const handleSave = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    try {
      let finalAvatarUrl = currentAvatar || "asset:default_avatar.png";
      if (
        currentAvatar &&
        !currentAvatar.startsWith("http://") &&
        !currentAvatar.startsWith("https://") &&
        !currentAvatar.startsWith("asset:")
      ) {
        finalAvatarUrl = await userService.uploadImage(currentAvatar, "avatar");
      }

      await userService.updateProfile({
        avatar_url: finalAvatarUrl,
      });
      setSaving(false);
      toast.success("Profile picture updated");
      router.back();
    } catch (e) {
      setSaving(false);
      console.log("Save avatar error:", e);
      toast.error("Failed to update profile photo");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerLeft}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Profile Photo
        </AppText>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={styles.headerRight}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Save profile photo"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText
              weight="bold"
              style={[
                styles.headerSaveText,
                { color: hasChanges ? colors.primary : colors.textSecondary },
                !hasChanges && { opacity: 0.5 }
              ]}
            >
              Save
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <AppImage
            source={resolveAvatarSource(currentAvatar)}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.optionsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Choose from Library"
          >
            <AppText weight="medium" style={[styles.optionText, { color: colors.textPrimary }]}>Choose from Library</AppText>
            <Ionicons name="images-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={takeWithCamera}
            accessibilityRole="button"
            accessibilityLabel="Take Photo"
          >
            <AppText weight="medium" style={[styles.optionText, { color: colors.textPrimary }]}>Take Photo</AppText>
            <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleRemovePhoto}
            accessibilityRole="button"
            accessibilityLabel="Remove Current Photo"
          >
            <AppText weight="medium" style={[styles.optionText, { color: "#EF4444" }]}>Remove Current Photo</AppText>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    width: 60,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  optionsGroup: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "400",
  },
});
