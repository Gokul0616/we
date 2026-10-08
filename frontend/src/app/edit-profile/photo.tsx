import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
import { authStorage, StoredUser } from "../../services/authStorage";
import { toast } from "../../services/toastService";
import { resolveAvatarSource, PRESET_AVATAR_MAP } from "../../utils/mediaHelper";
import { useTheme } from "../../context/ThemeContext";

const PRESET_AVATARS = [
  { id: "asset:profile_gokul_avatar.jpg", source: PRESET_AVATAR_MAP["asset:profile_gokul_avatar.jpg"] },
  { id: "asset:profile_avatar.jpg", source: PRESET_AVATAR_MAP["asset:profile_avatar.jpg"] },
  { id: "asset:onboarding_hero.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_hero.jpg"] },
  { id: "asset:onboarding_slide_2.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_slide_2.jpg"] },
  { id: "asset:onboarding_slide_3.jpg", source: PRESET_AVATAR_MAP["asset:onboarding_slide_3.jpg"] },
  { id: "asset:explore_food.jpg", source: PRESET_AVATAR_MAP["asset:explore_food.jpg"] },
];

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
      console.warn("pickFromGallery error:", e);
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
      console.warn("takeWithCamera error:", e);
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
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Profile Photo
        </Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={styles.headerRight}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.headerSaveText,
                { color: hasChanges ? colors.primary : colors.textSecondary },
                !hasChanges && { opacity: 0.5 }
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Image
            source={resolveAvatarSource(currentAvatar)}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.optionsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={pickFromGallery}
          >
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Choose from Library</Text>
            <Ionicons name="images-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={takeWithCamera}
          >
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Take Photo</Text>
            <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleRemovePhoto}
          >
            <Text style={[styles.optionText, { color: "#EF4444" }]}>Remove Current Photo</Text>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          PRESET AVATARS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsList}
        >
          {PRESET_AVATARS.map((item) => {
            const isSelected = currentAvatar === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentAvatar(item.id)}
                activeOpacity={0.8}
                style={[
                  styles.presetWrapper,
                  { borderColor: isSelected ? colors.primary : "transparent" }
                ]}
              >
                <Image source={item.source} style={styles.presetImage} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
    marginLeft: 20,
  },
  presetsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  presetWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
  },
  presetImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
});
