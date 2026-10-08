import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { authStorage, StoredUser } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { resolveAvatarSource } from "../../utils/mediaHelper";
import { toast } from "../../services/toastService";
import { showAlert } from "../../services/alertService";
import {
  SettingsHeader,
  SettingsSection,
  SettingsRow,
} from "../../components/settings/SettingsUI";

export default function ProfileAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const handleLogout = () => {
    showAlert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await authStorage.clear();
              toast.info("Logged out successfully");
              router.replace("/onboarding" as any);
            } catch (_) {
              router.replace("/onboarding" as any);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loadUser = async () => {
      const stored = await authStorage.getUser();
      if (stored) setCurrentUser(stored);
      try {
        const profile = await userService.getProfile();
        if (profile) setCurrentUser(profile);
      } catch (_) {}
    };

    loadUser();
    const unsub = userService.subscribe((u) => {
      if (u) setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const displayName = currentUser?.full_name || currentUser?.username || "Account";
  const displayUsername = currentUser?.username ? `@${currentUser.username}` : "@user";
  const displayBio = currentUser?.bio || "Digital creator & explorer";
  const displayWebsite = currentUser?.website || "https://we.app";
  const displayEmail = currentUser?.email || "user@example.com";
  const displayPhone = (currentUser as any)?.phone || "+1 98765 43210";
  const displayGender = (currentUser as any)?.gender || "Not specified";
  const displayDob = (currentUser as any)?.date_of_birth || "Add your date of birth";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title="Profile & Account" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Box */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/edit-profile/photo" as any)}
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={resolveAvatarSource(currentUser?.avatar_url)}
              style={styles.avatar}
            />
            <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={11} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.profileName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#2563EB"
                style={styles.verifiedBadge}
              />
            </View>
            <Text
              style={[styles.profileUsername, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {displayUsername}
            </Text>
            <Text
              style={[styles.profileActionHint, { color: colors.primary }]}
              numberOfLines={1}
            >
              Change profile picture
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Public Profile Details */}
        <SettingsSection>
          <SettingsRow
            icon="person-outline"
            title="Name"
            value={displayName}
            onPress={() => router.push("/settings/name" as any)}
          />
          <SettingsRow
            icon="at-outline"
            title="Username"
            value={displayUsername}
            onPress={() => router.push("/settings/username" as any)}
          />
          <SettingsRow
            icon="create-outline"
            title="Bio"
            value={displayBio.length > 25 ? `${displayBio.slice(0, 25)}...` : displayBio}
            onPress={() => router.push("/edit-profile/bio" as any)}
          />
          <SettingsRow
            icon="globe-outline"
            title="Website"
            value={displayWebsite}
            onPress={() => router.push("/edit-profile/website" as any)}
            isLast
          />
        </SettingsSection>

        {/* Account Settings */}
        <SettingsSection title="Account Settings">
          <SettingsRow
            icon="mail-outline"
            title="Email"
            value={displayEmail}
            onPress={() => router.push("/settings/email" as any)}
          />
          <SettingsRow
            icon="call-outline"
            title="Phone Number"
            value={displayPhone}
            onPress={() => router.push("/settings/phone" as any)}
          />
          <SettingsRow
            icon="transgender-outline"
            title="Gender"
            value={displayGender}
            onPress={() => router.push("/settings/gender" as any)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Password & Security"
            subtitle="Update password, 2FA and sessions"
            onPress={() => router.push("/settings/account-security" as any)}
            isLast
          />
        </SettingsSection>

        {/* Personal Information */}
        <SettingsSection title="Personal Information">
          <SettingsRow
            icon="calendar-outline"
            title="Date of Birth"
            value={displayDob}
            onPress={() => router.push("/settings/date-of-birth" as any)}
            isLast
          />
        </SettingsSection>

        {/* Account Actions / Log Out */}
        <SettingsSection>
          <SettingsRow
            icon="log-out-outline"
            iconColor="#EF4444"
            title="Log Out"
            destructive
            showChevron={false}
            onPress={handleLogout}
            isLast
          />
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E2E8F0",
  },
  profileText: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "75%",
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  profileUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  profileActionHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
