import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily } from "../../constants/theme";
import { AppText } from "../../components/common/AppText";
import { authStorage, StoredUser } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { resolveAvatarSource } from "../../utils/mediaHelper";
import { SettingsRow } from "../../components/settings/SettingsUI";

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

interface SearchableSetting {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  keywords: string[];
}

const ALL_SEARCHABLE_SETTINGS: SearchableSetting[] = [
  // --- Appearance & Display ---
  {
    id: "dark-mode",
    title: "Dark Mode",
    subtitle: "Appearance · Easy on the eyes in low light",
    icon: "moon-outline",
    route: "/settings/appearance",
    keywords: ["dark mode", "dark", "night", "theme", "black", "color", "display"],
  },
  {
    id: "light-mode",
    title: "Light Mode",
    subtitle: "Appearance · Clean, bright look for daytime",
    icon: "sunny-outline",
    route: "/settings/appearance",
    keywords: ["light mode", "light", "day", "bright", "white", "theme", "appearance"],
  },
  {
    id: "theme-system",
    title: "Match System Theme",
    subtitle: "Appearance · Sync automatically with device theme",
    icon: "sync-outline",
    route: "/settings/appearance",
    keywords: ["system", "auto", "device", "match system", "theme", "appearance"],
  },
  {
    id: "bottom-bar-style",
    title: "Bottom Bar Style",
    subtitle: "Appearance · Translucent glass or solid bar",
    icon: "water-outline",
    route: "/settings/appearance",
    keywords: ["tabs", "tab bar", "bottom bar", "bottom tabs", "navigation", "glass", "solid", "native"],
  },
  {
    id: "appearance-main",
    title: "Appearance",
    subtitle: "Theme, dark mode, navigation bar style",
    icon: "color-palette-outline",
    route: "/settings/appearance",
    keywords: ["appearance", "theme", "display", "look", "dark mode", "light mode"],
  },

  // --- Profile & Account ---
  {
    id: "profile-main",
    title: "Profile & Account",
    subtitle: "Account · Manage your personal details and info",
    icon: "person-outline",
    route: "/settings/profile-account",
    keywords: ["profile", "account", "personal info", "edit profile", "avatar", "bio"],
  },
  {
    id: "name",
    title: "Display Name",
    subtitle: "Account · Update your full name",
    icon: "person-outline",
    route: "/settings/name",
    keywords: ["name", "display name", "full name", "rename"],
  },
  {
    id: "username",
    title: "Username",
    subtitle: "Account · Change your unique @handle",
    icon: "at-outline",
    route: "/settings/username",
    keywords: ["username", "handle", "@", "user name"],
  },
  {
    id: "birthday",
    title: "Date of Birth",
    subtitle: "Account · Birthday and zodiac sign",
    icon: "calendar-outline",
    route: "/settings/date-of-birth",
    keywords: ["birthday", "date of birth", "dob", "birth", "age", "zodiac", "horoscope", "calendar"],
  },
  {
    id: "gender",
    title: "Gender",
    subtitle: "Account · Select your gender identity",
    icon: "transgender-outline",
    route: "/settings/gender",
    keywords: ["gender", "male", "female", "pronouns", "identity", "sex"],
  },
  {
    id: "email",
    title: "Email Address",
    subtitle: "Account · Manage your login email",
    icon: "mail-outline",
    route: "/settings/email",
    keywords: ["email", "mail", "address", "contact email"],
  },
  {
    id: "phone",
    title: "Phone Number",
    subtitle: "Account · Manage your contact number",
    icon: "call-outline",
    route: "/settings/phone",
    keywords: ["phone", "mobile", "number", "cell", "sms", "telephone"],
  },
  {
    id: "security",
    title: "Account Security",
    subtitle: "Account · Password, 2FA, login sessions",
    icon: "shield-checkmark-outline",
    route: "/settings/account-security",
    keywords: ["security", "account security"],
  },
  {
    id: "password",
    title: "Change Password",
    subtitle: "Account · Update your account password",
    icon: "key-outline",
    route: "/settings/change-password",
    keywords: ["password", "change password", "reset password", "security", "pass"],
  },
  {
    id: "two-factor",
    title: "Two-Factor Authentication",
    subtitle: "Account · Extra login security with 2FA",
    icon: "shield-outline",
    route: "/settings/two-factor",
    keywords: ["two factor", "2fa", "two-factor", "authentication", "otp", "code", "security"],
  },
  {
    id: "login-activity",
    title: "Login Activity",
    subtitle: "Account · Active sessions and logged-in devices",
    icon: "phone-portrait-outline",
    route: "/settings/login-activity",
    keywords: ["login activity", "sessions", "devices", "active logins", "logins", "where you are logged in"],
  },
  {
    id: "delete-account",
    title: "Delete Account",
    subtitle: "Account · Permanently remove your account and data",
    icon: "trash-outline",
    route: "/settings/delete-account",
    keywords: ["delete account", "deactivate", "remove account", "close account", "delete"],
  },

  // --- Privacy ---
  {
    id: "privacy-main",
    title: "Privacy",
    subtitle: "Who can see your content and interactions",
    icon: "lock-closed-outline",
    route: "/settings/privacy",
    keywords: ["privacy", "account privacy", "interactions", "who can see"],
  },
  {
    id: "private-account",
    title: "Private Account",
    subtitle: "Privacy · Only approved followers see your posts",
    icon: "lock-closed-outline",
    route: "/settings/privacy",
    keywords: ["private account", "private", "public", "visibility", "followers only"],
  },
  {
    id: "blocked-users",
    title: "Blocked Users",
    subtitle: "Privacy · View and manage blocked accounts",
    icon: "hand-left-outline",
    route: "/settings/blocked-users",
    keywords: ["blocked", "blocked users", "block", "unblock", "restricted", "mute"],
  },
  {
    id: "hidden-words",
    title: "Hidden Words",
    subtitle: "Privacy · Filter offensive comments and keywords",
    icon: "eye-off-outline",
    route: "/settings/hidden-words",
    keywords: ["hidden words", "words", "filter", "comments", "offensive", "mute words", "keywords"],
  },
  {
    id: "audience",
    title: "Post Audience",
    subtitle: "Privacy · Default audience for your new posts",
    icon: "people-outline",
    route: "/settings/audience-selection",
    keywords: ["audience", "default audience", "post audience", "who can see", "public", "followers"],
  },

  // --- Notifications ---
  {
    id: "notifications-main",
    title: "Notifications",
    subtitle: "Push, email, and in-app alerts",
    icon: "notifications-outline",
    route: "/settings/notifications",
    keywords: ["notifications", "push", "alerts", "likes", "comments", "mentions", "follows", "email notifications"],
  },

  // --- Content Preferences ---
  {
    id: "content-main",
    title: "Content Preferences",
    subtitle: "Feed, interests, media, and language",
    icon: "grid-outline",
    route: "/settings/content-preferences",
    keywords: ["content", "preferences", "feed", "explore"],
  },
  {
    id: "topics",
    title: "Interested Topics",
    subtitle: "Content Preferences · Topics and categories for your feed",
    icon: "sparkles-outline",
    route: "/settings/interested-topics",
    keywords: ["topics", "interested topics", "interests", "feed", "explore", "content", "tags"],
  },
  {
    id: "language",
    title: "Language",
    subtitle: "Content Preferences · Choose your preferred language",
    icon: "globe-outline",
    route: "/settings/language",
    keywords: ["language", "english", "locale", "translation"],
  },
  {
    id: "permissions",
    title: "App Permissions",
    subtitle: "Content Preferences · Camera, photos, microphone, location",
    icon: "options-outline",
    route: "/settings/app-permissions",
    keywords: ["permissions", "camera", "photos", "microphone", "location", "access"],
  },

  // --- Help & Support ---
  {
    id: "help-main",
    title: "Help & Support",
    subtitle: "FAQs, contact us, report a problem",
    icon: "help-circle-outline",
    route: "/settings/help-support",
    keywords: ["help", "support", "contact", "faqs"],
  },
  {
    id: "help-center",
    title: "Help Center",
    subtitle: "Help & Support · Frequently asked questions and guides",
    icon: "help-circle-outline",
    route: "/settings/help-center",
    keywords: ["help center", "faq", "guides", "questions", "support", "help"],
  },
  {
    id: "report-problem",
    title: "Report a Problem",
    subtitle: "Help & Support · Send feedback or report an issue",
    icon: "alert-circle-outline",
    route: "/settings/report-problem",
    keywords: ["report a problem", "report", "bug", "issue", "contact", "feedback", "problem"],
  },

  // --- About ---
  {
    id: "about-main",
    title: "About WE",
    subtitle: "Version 1.0.0, terms of service, privacy policy",
    icon: "information-circle-outline",
    route: "/settings/about",
    keywords: ["about", "version", "terms", "policy", "legal", "terms of service", "privacy policy"],
  },
];

export default function SettingsHomeScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "account",
        title: "Account",
        subtitle: "Profile, username, personal info",
        icon: "person-outline",
        route: "/settings/profile-account",
      },
      {
        id: "privacy",
        title: "Privacy",
        subtitle: "Who can see your content, interactions",
        icon: "lock-closed-outline",
        route: "/settings/privacy",
      },
      {
        id: "appearance",
        title: "Appearance",
        subtitle: isDark ? "Dark mode" : "Light mode",
        icon: isDark ? "moon-outline" : "sunny-outline",
        route: "/settings/appearance",
      },
      {
        id: "notifications",
        title: "Notifications",
        subtitle: "Push, email, in-app notifications",
        icon: "notifications-outline",
        route: "/settings/notifications",
      },
      {
        id: "content-preferences",
        title: "Content Preferences",
        subtitle: "Feed, media, language",
        icon: "grid-outline",
        route: "/settings/content-preferences",
      },
      {
        id: "help-support",
        title: "Help & Support",
        subtitle: "FAQs, contact us, report a problem",
        icon: "help-circle-outline",
        route: "/settings/help-support",
      },
      {
        id: "about",
        title: "About WE",
        subtitle: "Version 1.0.0",
        icon: "information-circle-outline",
        route: "/settings/about",
      },
    ],
    [isDark]
  );

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

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return menuItems;

    // Search across all settings & sub-settings
    return ALL_SEARCHABLE_SETTINGS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) =>
        k.toLowerCase().includes(q) || q.includes(k.toLowerCase())
      );
      return matchTitle || matchSubtitle || matchKeywords;
    }).sort((a, b) => {
      // Prioritize title matches
      const aTitleMatch = a.title.toLowerCase().includes(q);
      const bTitleMatch = b.title.toLowerCase().includes(q);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });
  }, [searchQuery, menuItems]);

  const displayName = currentUser?.full_name || currentUser?.username || "Account";
  const displayUsername = currentUser?.username ? `@${currentUser.username}` : "@user";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Settings
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search settings..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Header Card */}
        {!searchQuery && (
          <TouchableOpacity
            style={[
              styles.profileCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/settings/profile-account" as any)}
            activeOpacity={0.75}
          >
            <Image
              source={resolveAvatarSource(currentUser?.avatar_url)}
              style={styles.avatar}
            />

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <AppText
                  weight="bold"
                  style={[styles.profileName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {displayName}
                </AppText>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#2563EB"
                  style={styles.verifiedBadge}
                />
              </View>
              <AppText
                style={[styles.profileUsername, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {displayUsername}
              </AppText>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Menu Items Card */}
        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {filteredItems.map((item, index) => (
            <SettingsRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => router.push(item.route as any)}
              isLast={index === filteredItems.length - 1}
            />
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptySearch}>
              <AppText style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                No settings found for "{searchQuery}"
              </AppText>
            </View>
          )}
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
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    height: "100%",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FontFamily.bold,
    maxWidth: "80%",
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  profileUsername: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  menuCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  emptySearch: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
});
