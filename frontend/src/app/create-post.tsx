import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Vibration,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { FontFamily } from "../constants/theme";
import { postService } from "../services/postService";
import { toast } from "../services/toastService";
import { authStorage, StoredUser } from "../services/authStorage";
import { resolveAvatarSource } from "../utils/mediaHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface SelectedMediaItem {
  id: string;
  uri: string;
  type: "photo" | "video";
}

const POPULAR_LOCATIONS = [
  "Bali, Indonesia 🌴",
  "Santorini, Greece 🇬🇷",
  "Tokyo, Japan ⛩️",
  "New York, USA 🗽",
  "Paris, France 🗼",
  "London, UK 🎡",
  "Milan, Italy 🇮🇹",
  "Dubai, UAE 🏙️",
];

const POPULAR_TAGS = [
  "#Travel",
  "#Photography",
  "#Lifestyle",
  "#Art",
  "#Food",
  "#Nature",
  "#Tech",
  "#Vibes",
];

const PRIVACY_OPTIONS = [
  { key: "public", label: "Public", icon: "globe-outline", desc: "Anyone on WE can see this" },
  { key: "friends", label: "Followers", icon: "people-outline", desc: "Only followers can see" },
  { key: "private", label: "Only Me", icon: "lock-closed-outline", desc: "Visible only to you" },
] as const;

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedMedias, setSelectedMedias] = useState<SelectedMediaItem[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacyIndex, setPrivacyIndex] = useState(0);

  // Quick picker drawer toggles
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);

  // Publishing state
  const [isPosting, setIsPosting] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Load current user for avatar & handle
  useEffect(() => {
    authStorage.getUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 50 : 16);
  const bottomPadding = Math.max(insets.bottom, 14);

  const canPost = (caption.trim().length > 0 || selectedMedias.length > 0) && !isPosting;
  const currentPrivacy = PRIVACY_OPTIONS[privacyIndex];

  // Pick Photos / Videos from Library
  const handlePickMedia = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access in your settings to select photos and videos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: SelectedMediaItem[] = result.assets.map((asset, index) => ({
          id: `media_${Date.now()}_${index}`,
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "photo",
        }));
        setSelectedMedias((prev) => [...prev, ...newItems].slice(0, 10));
      }
    } catch (e) {
      console.warn("handlePickMedia error:", e);
      toast.error("Could not access photo library");
    }
  };

  // Capture Photo with Camera
  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newItem: SelectedMediaItem = {
          id: `camera_${Date.now()}`,
          uri: asset.uri,
          type: "photo",
        };
        setSelectedMedias((prev) => [...prev, newItem].slice(0, 10));
      }
    } catch (e) {
      console.warn("handleTakePhoto error:", e);
      toast.error("Could not open camera");
    }
  };

  // Remove individual media
  const handleRemoveMedia = (id: string) => {
    setSelectedMedias((prev) => prev.filter((m) => m.id !== id));
  };

  // Toggle Tag Chip
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  // Handle Cancel / Discard
  const handleCancel = () => {
    Keyboard.dismiss();
    if (caption.trim().length > 0 || selectedMedias.length > 0) {
      Alert.alert(
        "Discard Post?",
        "Are you sure you want to discard this post? Your draft will not be saved.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // Publish Post directly (Fast, modern, zero clunky modals)
  const handlePublish = async () => {
    if (!canPost) return;

    Keyboard.dismiss();
    try {
      Vibration.vibrate(20);
    } catch (_) {}

    setIsPosting(true);

    try {
      // 1. Upload local media files if any
      const uploadedUrls: string[] = [];
      for (const item of selectedMedias) {
        if (item.uri.startsWith("http://") || item.uri.startsWith("https://")) {
          uploadedUrls.push(item.uri);
        } else {
          const uploaded = await postService.uploadMedia(item.uri, item.type);
          if (uploaded) uploadedUrls.push(uploaded);
        }
      }

      const primaryMedia = uploadedUrls[0];
      const mediaType =
        selectedMedias.length > 1
          ? "carousel"
          : selectedMedias[0]?.type || "photo";

      // 2. Create post in backend & local feed cache
      await postService.createPost({
        content: caption.trim(),
        media_url: primaryMedia,
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        media_type: mediaType,
        location: location || undefined,
        tags: selectedTags,
        privacy: currentPrivacy.key as any,
      });

      setIsPosting(false);
      toast.success("Post shared successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      setIsPosting(false);
      console.warn("Post creation error:", e);
      toast.error(e?.message || "Failed to publish post. Please try again.");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top Header - Positioned safely below iOS Dynamic Island / Notch */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={isPosting}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          New Post
        </Text>

        <TouchableOpacity
          style={[
            styles.postBtn,
            canPost
              ? { backgroundColor: colors.primary }
              : { backgroundColor: isDark ? "#27272A" : "#E2E8F0" },
          ]}
          onPress={handlePublish}
          disabled={!canPost}
          activeOpacity={0.85}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.postBtnText,
                { color: canPost ? "#FFFFFF" : isDark ? "#71717A" : "#94A3B8" },
              ]}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* User Row with Avatar & Audience Pill */}
          <View style={styles.authorRow}>
            <Image
              source={resolveAvatarSource(currentUser?.avatar_url)}
              style={[styles.avatar, { borderColor: colors.border }]}
            />

            <View style={styles.authorMeta}>
              <Text
                style={[styles.authorName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {currentUser?.full_name || currentUser?.username || "You"}
              </Text>

              {/* Audience Selector Pill */}
              <TouchableOpacity
                style={[
                  styles.privacyPill,
                  {
                    backgroundColor: isDark ? "#18181B" : "#F1F5F9",
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPrivacyPicker(!showPrivacyPicker);
                  setShowLocationPicker(false);
                  setShowTagPicker(false);
                }}
              >
                <Ionicons
                  name={currentPrivacy.icon as any}
                  size={13}
                  color={colors.primary}
                />
                <Text style={[styles.privacyPillText, { color: colors.textPrimary }]}>
                  {currentPrivacy.label}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Dropdown (Inline, Clean) */}
          {showPrivacyPicker && (
            <View
              style={[
                styles.inlineDropdownCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {PRIVACY_OPTIONS.map((opt, idx) => {
                const isSelected = privacyIndex === idx;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.privacyOptionRow,
                      idx < PRIVACY_OPTIONS.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.borderLight,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPrivacyIndex(idx);
                      setShowPrivacyPicker(false);
                    }}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <View style={styles.privacyOptionTextCol}>
                      <Text
                        style={[
                          styles.privacyOptionTitle,
                          {
                            color: colors.textPrimary,
                            fontFamily: isSelected
                              ? FontFamily.bold
                              : FontFamily.medium,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.privacyOptionDesc,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {opt.desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Caption Input */}
          <TextInput
            ref={inputRef}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textMuted}
            style={[styles.captionInput, { color: colors.textPrimary }]}
            multiline
            value={caption}
            onChangeText={setCaption}
            selectionColor={colors.primary}
            maxLength={1000}
            textAlignVertical="top"
          />

          {/* Location & Tag Attached Chips */}
          {(location || selectedTags.length > 0) && (
            <View style={styles.chipsContainer}>
              {location && (
                <View
                  style={[
                    styles.attachedChip,
                    {
                      backgroundColor: isDark ? "#18181B" : "#EFF6FF",
                      borderColor: isDark ? "#27272A" : "#DBEAFE",
                    },
                  ]}
                >
                  <Ionicons name="location-sharp" size={13} color={colors.primary} />
                  <Text
                    style={[styles.chipText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {location}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocation(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedTags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.attachedChip,
                    {
                      backgroundColor: isDark ? "#18181B" : "#F1F5F9",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {tag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleTag(tag)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Media Preview Carousel */}
          {selectedMedias.length > 0 && (
            <View style={styles.mediaPreviewSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaScrollContent}
              >
                {selectedMedias.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.mediaCard,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />

                    {/* Remove button */}
                    <TouchableOpacity
                      style={styles.mediaRemoveBadge}
                      onPress={() => handleRemoveMedia(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Video Indicator */}
                    {item.type === "video" && (
                      <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={14} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Order index if multiple */}
                    {selectedMedias.length > 1 && (
                      <View style={styles.mediaIndexBadge}>
                        <Text style={styles.mediaIndexText}>
                          {index + 1}/{selectedMedias.length}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add More Media Tile */}
                {selectedMedias.length < 10 && (
                  <TouchableOpacity
                    style={[
                      styles.addMoreMediaCard,
                      {
                        backgroundColor: isDark ? "#18181B" : "#F8FAFC",
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={handlePickMedia}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={28} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.addMoreMediaText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* Inline Location Tray */}
          {showLocationPicker && (
            <View
              style={[
                styles.quickPickerTray,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.trayHeader}>
                <View style={styles.trayTitleRow}>
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={[styles.trayTitle, { color: colors.textPrimary }]}>
                    Add Location
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {POPULAR_LOCATIONS.map((loc) => {
                  const isSelected = location === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.pickerChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? "#18181B"
                            : "#F1F5F9",
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setLocation(isSelected ? null : loc);
                        setShowLocationPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerChipText,
                          {
                            color: isSelected ? "#FFFFFF" : colors.textPrimary,
                            fontFamily: isSelected
                              ? FontFamily.bold
                              : FontFamily.medium,
                          },
                        ]}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Inline Topic Tags Tray */}
          {showTagPicker && (
            <View
              style={[
                styles.quickPickerTray,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.trayHeader}>
                <View style={styles.trayTitleRow}>
                  <Ionicons name="pricetag" size={16} color={colors.primary} />
                  <Text style={[styles.trayTitle, { color: colors.textPrimary }]}>
                    Select Topics
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {POPULAR_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.pickerChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? "#18181B"
                            : "#F1F5F9",
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerChipText,
                          {
                            color: isSelected ? "#FFFFFF" : colors.textPrimary,
                            fontFamily: isSelected
                              ? FontFamily.bold
                              : FontFamily.medium,
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Bottom Attachment Toolbar */}
        <View
          style={[
            styles.bottomToolbar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          <View style={styles.toolbarButtons}>
            {/* Gallery Button */}
            <TouchableOpacity
              style={[
                styles.toolBtn,
                { backgroundColor: isDark ? "#18181B" : "#F1F5F9" },
              ]}
              onPress={handlePickMedia}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Camera Button */}
            <TouchableOpacity
              style={[
                styles.toolBtn,
                { backgroundColor: isDark ? "#18181B" : "#F1F5F9" },
              ]}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Location Toggle */}
            <TouchableOpacity
              style={[
                styles.toolBtn,
                {
                  backgroundColor: location
                    ? colors.primary
                    : isDark
                    ? "#18181B"
                    : "#F1F5F9",
                },
              ]}
              onPress={() => {
                setShowLocationPicker(!showLocationPicker);
                setShowTagPicker(false);
                setShowPrivacyPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={location ? "#FFFFFF" : colors.primary}
              />
            </TouchableOpacity>

            {/* Topic Tags Toggle */}
            <TouchableOpacity
              style={[
                styles.toolBtn,
                {
                  backgroundColor: selectedTags.length > 0
                    ? colors.primary
                    : isDark
                    ? "#18181B"
                    : "#F1F5F9",
                },
              ]}
              onPress={() => {
                setShowTagPicker(!showTagPicker);
                setShowLocationPicker(false);
                setShowPrivacyPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={selectedTags.length > 0 ? "#FFFFFF" : colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Character Count Indicator */}
          <View style={styles.characterCountCol}>
            <Text style={[styles.characterCountText, { color: colors.textMuted }]}>
              {caption.length}/1000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: Platform.OS === "ios" ? 104 : 64,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "#E2E8F0",
  },
  authorMeta: {
    marginLeft: 12,
    justifyContent: "center",
  },
  authorName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  privacyPillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  inlineDropdownCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  privacyOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  privacyOptionTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  privacyOptionTitle: {
    fontSize: 14,
  },
  privacyOptionDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  captionInput: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 24,
    minHeight: 120,
    paddingHorizontal: 0,
    paddingTop: 4,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  attachedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    maxWidth: SCREEN_WIDTH * 0.65,
  },
  mediaPreviewSection: {
    marginBottom: 16,
  },
  mediaScrollContent: {
    gap: 12,
  },
  mediaCard: {
    width: 170,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaRemoveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    flexDirection: "row",
    alignItems: "center",
  },
  mediaIndexBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  mediaIndexText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  addMoreMediaCard: {
    width: 120,
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addMoreMediaText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  quickPickerTray: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  trayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  trayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trayTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  chipsScroll: {
    gap: 8,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerChipText: {
    fontSize: 13,
  },
  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toolbarButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  characterCountCol: {
    justifyContent: "center",
  },
  characterCountText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});
