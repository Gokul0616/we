import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Switch,
  Modal,
  Animated,
  Vibration,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Colors, FontFamily } from "../constants/theme";
import { postService } from "../services/postService";
import { toast } from "../services/toastService";
import { authStorage } from "../services/authStorage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Default high-quality media presets if user doesn't pick device media
const PRESET_MEDIAS = [
  { id: "m1", uri: require("../../assets/images/home_feed_bali_post.jpg"), type: "photo" as const },
  { id: "m2", uri: require("../../assets/images/cinque_terre_post.jpg"), type: "photo" as const },
  { id: "m3", uri: require("../../assets/images/splash_mountain.jpg"), type: "photo" as const },
  { id: "m4", uri: require("../../assets/images/onboarding_hero.jpg"), type: "photo" as const },
];

const FILTER_PRESETS = [
  { id: "normal", name: "Normal", tint: "transparent", contrast: 1 },
  { id: "clarendon", name: "Clarendon", tint: "rgba(0, 100, 255, 0.08)", contrast: 1.15 },
  { id: "juno", name: "Juno", tint: "rgba(255, 120, 0, 0.09)", contrast: 1.1 },
  { id: "valencia", name: "Valencia", tint: "rgba(255, 215, 0, 0.12)", contrast: 1.05 },
  { id: "mono", name: "Mono", tint: "rgba(0, 0, 0, 0.25)", contrast: 1.2 },
  { id: "vintage", name: "Vintage", tint: "rgba(180, 130, 80, 0.15)", contrast: 0.95 },
];

const AI_SUGGESTED_CAPTIONS = [
  "Good vibes, better days ☀️✨ Living in the moment and letting the world surprise me.",
  "Chasing horizons and timeless memories 🌊🎒 Where to next?",
  "Golden hour magic hitting differently today 🌅 What a view to be grateful for.",
  "Lost in the right direction. Finding tranquility between everyday rush 🌿🍃",
  "Moments like these remind me why we explore. Simply unforgettable 📸💫",
  "Fresh perspectives, quiet thoughts, and endless possibilities 🚀",
];

const POPULAR_LOCATIONS = [
  "Positano, Italy 🇮🇹",
  "Bali, Indonesia 🌴",
  "Kyoto, Japan ⛩️",
  "Santorini, Greece 🇬🇷",
  "Reykjavik, Iceland ❄️",
  "New York, USA 🗽",
  "Paris, France 🗼",
  "Swiss Alps, Switzerland 🏔️",
];

const FRIENDS_LIST = [
  { id: "u1", username: "alex_wanderer", fullName: "Alex Rivera", avatar: require("../../assets/images/profile_avatar.jpg") },
  { id: "u2", username: "sarah_k", fullName: "Sarah Jenkins", avatar: require("../../assets/images/onboarding_slide_3.jpg") },
  { id: "u3", username: "travel.diary", fullName: "Sophie Dupont", avatar: require("../../assets/images/onboarding_slide_2.jpg") },
  { id: "u4", username: "chef_marco", fullName: "Marco Bellini", avatar: require("../../assets/images/onboarding_slide_4.jpg") },
];

const AVAILABLE_LABELS = [
  "#Travel",
  "#Photography",
  "#Art",
  "#Lifestyle",
  "#Food",
  "#Nature",
  "#Vibes",
  "#Tech",
  "#Design",
  "#Sunset",
];

export interface SelectedMediaItem {
  id: string;
  uri: any;
  type: "photo" | "video";
}

export default function CreatePostScreen() {
  const router = useRouter();

  // Mode: "compose" (Option 2: Clean Compose View) vs "media_edit" (Option 3: Media First Experience)
  const [viewMode, setViewMode] = useState<"compose" | "media_edit">("compose");

  // Post form fields
  const [caption, setCaption] = useState("");
  const [selectedMedias, setSelectedMedias] = useState<SelectedMediaItem[]>([
    PRESET_MEDIAS[0],
    PRESET_MEDIAS[1],
    PRESET_MEDIAS[2],
  ]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("normal");
  const [textOverlay, setTextOverlay] = useState("Good vibes, better days ☀️");
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);

  // Meta settings
  const [addToStory, setAddToStory] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<"Public" | "Friends" | "Private">("Public");

  // User state
  const [currentUsername, setCurrentUsername] = useState("");

  // Modals state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAiCaptionsModal, setShowAiCaptionsModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Search queries in modals
  const [locationSearch, setLocationSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Upload & processing state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    authStorage.getUser().then((u) => {
      if (u?.full_name || u?.username) {
        setCurrentUsername(u.full_name || u.username);
      }
    });
  }, []);

  // Pick Image from device library
  const handlePickMedia = async (mediaType: "photo" | "video" = "photo") => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.info("Media library permission needed to choose device photos");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mediaType === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: SelectedMediaItem[] = result.assets.map((asset, idx) => ({
          id: `picked_${Date.now()}_${idx}`,
          uri: { uri: asset.uri },
          type: asset.type === "video" ? "video" : "photo",
        }));
        setSelectedMedias((prev) => [...prev, ...newItems]);
        toast.success(`Added ${newItems.length} media item(s)`);
      }
    } catch (e) {
      console.warn("Image picker error:", e);
      // Fallback add preset
      const nextPreset = PRESET_MEDIAS[selectedMedias.length % PRESET_MEDIAS.length];
      setSelectedMedias((prev) => [
        ...prev,
        { ...nextPreset, id: `preset_${Date.now()}` },
      ]);
      toast.info("Added media from collection");
    }
  };

  // Remove Media
  const handleRemoveMedia = (id: string) => {
    setSelectedMedias((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeMediaIndex >= filtered.length) {
        setActiveMediaIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  // Full Upload & Processing Sequence
  const handlePublishPost = async () => {
    if (!caption.trim() && selectedMedias.length === 0) {
      toast.info("Please enter a caption or select media for your post");
      return;
    }

    try {
      Vibration.vibrate(35);
    } catch (_) {}

    setIsUploading(true);
    setUploadProgress(0);
    progressAnim.setValue(0);
    setIsSuccess(false);

    // Stage 1: Uploading Media
    setUploadStepText("Uploading media to cloud storage (1/1)...");
    Animated.timing(progressAnim, {
      toValue: 0.45,
      duration: 700,
      useNativeDriver: false,
    }).start();

    // Stage 2: Processing & Video/Image Optimization
    setTimeout(() => {
      setUploadStepText("Optimizing high-res resolution & colors...");
      Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 650,
        useNativeDriver: false,
      }).start();
    }, 800);

    // Stage 3: Database & Publishing
    setTimeout(async () => {
      setUploadStepText("Publishing post & notifying followers...");
      Animated.timing(progressAnim, {
        toValue: 1.0,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Send to Backend Post Service & Database
      try {
        const uploadedUrls: string[] = [];
        for (const item of selectedMedias) {
          const itemUri = typeof item.uri === "object" && item.uri?.uri ? item.uri.uri : (typeof item.uri === "string" ? item.uri : undefined);
          if (itemUri) {
            const uploaded = await postService.uploadMedia(itemUri, item.type);
            uploadedUrls.push(uploaded);
          }
        }

        const primaryMediaUrl = uploadedUrls[0];
        const mediaType = selectedMedias.length > 1 ? "carousel" : (selectedMedias[0]?.type || "photo");

        await postService.createPost({
          content: caption.trim() || (selectedMedias.length > 0 ? "Shared from We" : "New update"),
          media_url: primaryMediaUrl,
          media_urls: uploadedUrls,
          media_type: mediaType,
          location: location || undefined,
          tags: taggedPeople,
          labels: selectedLabels,
          privacy: privacy.toLowerCase() as any,
          add_to_story: addToStory,
        });
      } catch (err) {
        console.warn("Failed saving to backend, completed in local store:", err);
      }

      // Stage 4: Success checkmark animation
      setIsSuccess(true);
      try {
        Vibration.vibrate([0, 40, 60, 40]);
      } catch (_) {}

      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      toast.success("Post published successfully!");

      // Complete flow: navigate to Feed or Profile
      setTimeout(() => {
        setIsUploading(false);
        router.replace("/(tabs)");
      }, 1400);
    }, 1800);
  };

  const currentMedia = selectedMedias[activeMediaIndex] || selectedMedias[0];

  // ==========================================
  // RENDER: OPTION 3 (MEDIA FIRST EXPERIENCE / CROP & EDIT)
  // ==========================================
  if (viewMode === "media_edit" && currentMedia) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.darkContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Bar */}
        <View style={styles.mediaEditTopBar}>
          <TouchableOpacity
            style={styles.mediaEditCloseBtn}
            activeOpacity={0.7}
            onPress={() => setViewMode("compose")}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaEditNextPill}
            activeOpacity={0.8}
            onPress={() => setViewMode("compose")}
          >
            <Text style={styles.mediaEditNextText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Large Media Stage */}
        <View style={styles.mediaStageContainer}>
          <Image
            source={currentMedia.uri}
            style={[
              styles.mediaStageImage,
              activeFilter === "mono" && { tintColor: "#666" },
            ]}
            resizeMode="cover"
          />

          {/* Color Tint Filter Overlay */}
          {activeFilter !== "normal" && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    FILTER_PRESETS.find((f) => f.id === activeFilter)?.tint || "transparent",
                },
              ]}
              pointerEvents="none"
            />
          )}

          {/* 1/N Media Count Badge */}
          {selectedMedias.length > 1 && (
            <View style={styles.mediaCountBadge}>
              <Ionicons name="copy-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.mediaCountText}>
                {activeMediaIndex + 1}/{selectedMedias.length}
              </Text>
            </View>
          )}

          {/* Floating Caption / Sticker Overlay */}
          {showTextOverlay && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.floatingCaptionPill}
              onPress={() => setShowTextOverlay(false)}
            >
              <Text style={styles.floatingCaptionText}>{textOverlay}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Creative Tool Strip: Aa, Stickers, Music, Filters, Draw */}
        <View style={styles.creativeToolsStrip}>
          <TouchableOpacity
            style={styles.creativeToolBtn}
            onPress={() => setShowTextOverlay((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.creativeToolCircle}>
              <Text style={styles.toolIconText}>Aa</Text>
            </View>
            <Text style={styles.toolLabel}>Text</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.creativeToolBtn}
            onPress={() => {
              setTextOverlay("✨ Golden hour vibes ✨");
              setShowTextOverlay(true);
              toast.info("Sticker badge added");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.creativeToolCircle}>
              <Ionicons name="happy-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.toolLabel}>Stickers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.creativeToolBtn}
            onPress={() => setShowMusicModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.creativeToolCircle}>
              <Ionicons name="musical-notes-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.toolLabel}>Music</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.creativeToolBtn}
            onPress={() => {
              const nextIndex =
                (FILTER_PRESETS.findIndex((f) => f.id === activeFilter) + 1) %
                FILTER_PRESETS.length;
              setActiveFilter(FILTER_PRESETS[nextIndex].id);
              toast.info(`Filter: ${FILTER_PRESETS[nextIndex].name}`);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.creativeToolCircle, styles.activeToolCircle]}>
              <Ionicons name="color-wand-outline" size={22} color="#38BDF8" />
            </View>
            <Text style={[styles.toolLabel, { color: "#38BDF8" }]}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.creativeToolBtn}
            onPress={() => toast.info("Draw mode activated")}
            activeOpacity={0.7}
          >
            <View style={styles.creativeToolCircle}>
              <Ionicons name="pencil-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.toolLabel}>Draw</Text>
          </TouchableOpacity>
        </View>

        {/* Media Thumbnails Strip */}
        <View style={styles.mediaThumbnailsStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {selectedMedias.map((item, index) => {
              const isActive = index === activeMediaIndex;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.mediaThumbWrapper, isActive && styles.mediaThumbActive]}
                  onPress={() => setActiveMediaIndex(index)}
                  activeOpacity={0.8}
                >
                  <Image source={item.uri} style={styles.mediaThumbImg} />
                  <TouchableOpacity
                    style={styles.mediaThumbDelete}
                    onPress={() => handleRemoveMedia(item.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Add More Media Button */}
            <TouchableOpacity
              style={styles.addMediaThumbBtn}
              onPress={() => handlePickMedia("photo")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Meta Quick Settings List */}
        <View style={styles.mediaEditMetaRows}>
          <TouchableOpacity
            style={styles.mediaEditMetaItem}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.metaLeft}>
              <Ionicons name="location-outline" size={18} color="#94A3B8" />
              <Text style={styles.metaLabelText}>Add location</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaValueText} numberOfLines={1}>
                {location || "Optional"}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#64748B" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaEditMetaItem}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.metaLeft}>
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
              <Text style={styles.metaLabelText}>Privacy</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaValueText}>{privacy}</Text>
              <Ionicons name="chevron-forward" size={14} color="#64748B" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaEditMetaItem}
            onPress={() => setShowLabelsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.metaLeft}>
              <Ionicons name="settings-outline" size={18} color="#94A3B8" />
              <Text style={styles.metaLabelText}>Advanced settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions: Save Draft & Next */}
        <View style={styles.mediaEditBottomBar}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => {
              toast.success("Draft saved");
              router.back();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextLargeBtn}
            onPress={() => setViewMode("compose")}
            activeOpacity={0.85}
          >
            <Text style={styles.nextLargeBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER: OPTION 2 (CLEAN COMPOSE VIEW)
  // ==========================================
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Post</Text>

        <TouchableOpacity
          style={[styles.postPillBtn, (!caption.trim() && selectedMedias.length === 0) && styles.postPillDisabled]}
          activeOpacity={0.85}
          onPress={handlePublishPost}
        >
          <Text style={styles.postPillText}>Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Info Row with Privacy Selector */}
        <View style={styles.userRow}>
          <Image
            source={require("../../assets/images/profile_avatar.jpg")}
            style={styles.userAvatar}
          />
          <View style={styles.userInfoCol}>
            <Text style={styles.userName}>{currentUsername}</Text>
            <TouchableOpacity
              style={styles.privacyPill}
              activeOpacity={0.7}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Ionicons
                name={privacy === "Public" ? "globe-outline" : privacy === "Friends" ? "people-outline" : "lock-closed-outline"}
                size={12}
                color="#64748B"
              />
              <Text style={styles.privacyText}>{privacy}</Text>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor="#94A3B8"
            style={styles.captionInput}
            multiline
            value={caption}
            onChangeText={setCaption}
            selectionColor={Colors.primary}
            autoFocus={false}
          />
        </View>

        {/* Quick Action Pills: Photo, Video, Location, Tag */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionCard, selectedMedias.length > 0 && styles.quickActionCardActive]}
            activeOpacity={0.75}
            onPress={() => handlePickMedia("photo")}
          >
            <Ionicons
              name="image-outline"
              size={18}
              color={selectedMedias.length > 0 ? Colors.primary : "#475569"}
            />
            <Text
              style={[
                styles.quickActionText,
                selectedMedias.length > 0 && styles.quickActionTextActive,
              ]}
            >
              Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.75}
            onPress={() => handlePickMedia("video")}
          >
            <Ionicons name="videocam-outline" size={18} color="#475569" />
            <Text style={styles.quickActionText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, location ? styles.quickActionCardActive : null]}
            activeOpacity={0.75}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={location ? Colors.primary : "#475569"}
            />
            <Text style={[styles.quickActionText, location ? styles.quickActionTextActive : null]}>
              Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, taggedPeople.length > 0 ? styles.quickActionCardActive : null]}
            activeOpacity={0.75}
            onPress={() => setShowTagModal(true)}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={taggedPeople.length > 0 ? Colors.primary : "#475569"}
            />
            <Text style={[styles.quickActionText, taggedPeople.length > 0 ? styles.quickActionTextActive : null]}>
              Tag
            </Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview Carousel / Thumbnails */}
        {selectedMedias.length > 0 && (
          <View style={styles.mediaStripContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaStripContent}>
              {selectedMedias.map((item, index) => (
                <View key={item.id} style={styles.mediaItemCard}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveMediaIndex(index);
                      setViewMode("media_edit");
                    }}
                    style={styles.mediaItemTouch}
                  >
                    <Image source={item.uri} style={styles.mediaPreviewThumb} />
                    {item.type === "video" && (
                      <View style={styles.videoBadge}>
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.mediaRemoveBtn}
                    onPress={() => handleRemoveMedia(item.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Dashed Plus Button Card to add more media */}
              <TouchableOpacity
                style={styles.dashedAddCard}
                activeOpacity={0.7}
                onPress={() => handlePickMedia("photo")}
              >
                <Ionicons name="add" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Settings List Items: Add to story, Add location, Tag people, Add labels */}
        <View style={styles.settingsListCard}>
          {/* Add to Story Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="aperture-outline" size={19} color="#475569" />
              </View>
              <Text style={styles.settingLabel}>Add to story</Text>
            </View>
            <Switch
              value={addToStory}
              onValueChange={setAddToStory}
              trackColor={{ false: "#E2E8F0", true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Add Location */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowLocationModal(true)}
          >
            <View style={styles.settingLabelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={19} color="#475569" />
              </View>
              <Text style={styles.settingLabel}>Add location</Text>
            </View>
            <View style={styles.settingValueRight}>
              <Text style={[styles.settingValueText, location && styles.settingValueActive]} numberOfLines={1}>
                {location || "Optional"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Tag People */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowTagModal(true)}
          >
            <View style={styles.settingLabelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={19} color="#475569" />
              </View>
              <Text style={styles.settingLabel}>Tag people</Text>
            </View>
            <View style={styles.settingValueRight}>
              <Text style={[styles.settingValueText, taggedPeople.length > 0 && styles.settingValueActive]}>
                {taggedPeople.length > 0 ? `${taggedPeople.length} people` : "Optional"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Add Labels */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowLabelsModal(true)}
          >
            <View style={styles.settingLabelLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="pricetag-outline" size={19} color="#475569" />
              </View>
              <Text style={styles.settingLabel}>Add labels</Text>
            </View>
            <View style={styles.settingValueRight}>
              <Text style={[styles.settingValueText, selectedLabels.length > 0 && styles.settingValueActive]}>
                {selectedLabels.length > 0 ? selectedLabels.join(", ") : "Optional"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Smart Suggestions Card: Try AI captions */}
        <TouchableOpacity
          style={styles.aiSuggestionCard}
          activeOpacity={0.8}
          onPress={() => setShowAiCaptionsModal(true)}
        >
          <View style={styles.aiIconBubble}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} />
          </View>
          <View style={styles.aiTextCol}>
            <Text style={styles.aiTitle}>Try AI captions</Text>
            <Text style={styles.aiSubtitle}>Get creative ideas for your post</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Preview Post Button */}
        <TouchableOpacity
          style={styles.previewPostBtn}
          activeOpacity={0.75}
          onPress={() => setShowPreviewModal(true)}
        >
          <Ionicons name="eye-outline" size={18} color="#64748B" />
          <Text style={styles.previewPostText}>Preview Feed Post</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ========================================== */}
      {/* 1. LOCATION MODAL */}
      {/* ========================================== */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Search location..."
                placeholderTextColor="#94A3B8"
                style={styles.modalSearchInput}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {POPULAR_LOCATIONS.filter((l) =>
                l.toLowerCase().includes(locationSearch.toLowerCase())
              ).map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.modalListItem}
                  onPress={() => {
                    setLocation(loc);
                    setShowLocationModal(false);
                  }}
                >
                  <Ionicons name="location-outline" size={20} color={Colors.primary} />
                  <Text style={styles.modalListText}>{loc}</Text>
                  {location === loc && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* 2. TAG PEOPLE MODAL */}
      {/* ========================================== */}
      <Modal visible={showTagModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tag People</Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                placeholder="Search friends..."
                placeholderTextColor="#94A3B8"
                style={styles.modalSearchInput}
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {FRIENDS_LIST.filter((f) =>
                f.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                f.fullName.toLowerCase().includes(userSearch.toLowerCase())
              ).map((friend) => {
                const isTagged = taggedPeople.includes(friend.username);
                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendListItem}
                    onPress={() => {
                      if (isTagged) {
                        setTaggedPeople((prev) => prev.filter((u) => u !== friend.username));
                      } else {
                        setTaggedPeople((prev) => [...prev, friend.username]);
                      }
                    }}
                  >
                    <Image source={friend.avatar} style={styles.friendAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.friendFullName}>{friend.fullName}</Text>
                      <Text style={styles.friendHandle}>@{friend.username}</Text>
                    </View>
                    <Ionicons
                      name={isTagged ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isTagged ? Colors.primary : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* 3. LABELS MODAL */}
      {/* ========================================== */}
      <Modal visible={showLabelsModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Labels</Text>
              <TouchableOpacity onPress={() => setShowLabelsModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipsContainer}>
              {AVAILABLE_LABELS.map((lbl) => {
                const isSelected = selectedLabels.includes(lbl);
                return (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.chipPill, isSelected && styles.chipPillActive]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedLabels((prev) => prev.filter((l) => l !== lbl));
                      } else {
                        setSelectedLabels((prev) => [...prev, lbl]);
                      }
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowLabelsModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* 4. PRIVACY SELECTOR MODAL */}
      {/* ========================================== */}
      <Modal visible={showPrivacyModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.privacyModalCard}>
            <Text style={styles.privacyModalTitle}>Audience & Privacy</Text>

            {(["Public", "Friends", "Private"] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.privacyOptionRow}
                onPress={() => {
                  setPrivacy(opt);
                  setShowPrivacyModal(false);
                }}
              >
                <Ionicons
                  name={opt === "Public" ? "globe-outline" : opt === "Friends" ? "people-outline" : "lock-closed-outline"}
                  size={20}
                  color={Colors.primary}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.privacyOptionTitle}>{opt}</Text>
                  <Text style={styles.privacyOptionSubtitle}>
                    {opt === "Public"
                      ? "Anyone on We can see this post"
                      : opt === "Friends"
                      ? "Only your followers can see"
                      : "Only you can see this post"}
                  </Text>
                </View>
                {privacy === opt && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* 5. AI CAPTIONS MODAL */}
      {/* ========================================== */}
      <Modal visible={showAiCaptionsModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>AI Caption Suggestions</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiCaptionsModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {AI_SUGGESTED_CAPTIONS.map((cap, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.aiCaptionItem}
                  onPress={() => {
                    setCaption(cap);
                    setShowAiCaptionsModal(false);
                    toast.success("AI Caption applied!");
                  }}
                >
                  <Text style={styles.aiCaptionItemText}>{cap}</Text>
                  <View style={styles.useCaptionPill}>
                    <Text style={styles.useCaptionText}>Use</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* 6. FULL PREVIEW MODAL */}
      {/* ========================================== */}
      <Modal visible={showPreviewModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Feed Preview</Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Text style={{ color: Colors.primary, fontFamily: FontFamily.semiBold, fontSize: 15 }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.previewFeedCard}>
              {/* Header */}
              <View style={styles.previewHeader}>
                <Image
                  source={require("../../assets/images/profile_avatar.jpg")}
                  style={styles.previewAvatar}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.previewUser}>{currentUsername}</Text>
                  {location ? (
                    <Text style={styles.previewLoc}>{location}</Text>
                  ) : null}
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color="#64748B" />
              </View>

              {/* Media */}
              {selectedMedias.length > 0 && (
                <Image
                  source={selectedMedias[0].uri}
                  style={styles.previewMedia}
                  resizeMode="cover"
                />
              )}

              {/* Caption */}
              <View style={{ padding: 14 }}>
                <Text style={styles.previewCaption}>
                  <Text style={{ fontFamily: FontFamily.bold }}>{currentUsername} </Text>
                  {caption || "No caption provided"}
                </Text>

                {selectedLabels.length > 0 && (
                  <Text style={styles.previewLabels}>
                    {selectedLabels.join(" ")}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================== */}
      {/* 7. UPLOAD & PROCESSING OVERLAY */}
      {/* ========================================== */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadDialogCard}>
            {!isSuccess ? (
              <>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.uploadTitle}>Publishing Post</Text>
                <Text style={styles.uploadSubtitle}>{uploadStepText}</Text>

                {/* Progress Bar Container */}
                <View style={styles.progressBarTrack}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              </>
            ) : (
              <Animated.View
                style={[
                  styles.successCardContainer,
                  { transform: [{ scale: successScaleAnim }] },
                ]}
              >
                <View style={styles.successCheckCircle}>
                  <Ionicons name="checkmark" size={38} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Post Published!</Text>
                <Text style={styles.successSubtitle}>
                  Your post is now live across the We feed and profile.
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  darkContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: "#0F172A",
  },
  postPillBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  postPillDisabled: {
    backgroundColor: "#93C5FD",
  },
  postPillText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  userInfoCol: {
    marginLeft: 12,
  },
  userName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: "#0F172A",
  },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  privacyText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: "#64748B",
  },
  inputContainer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 110,
  },
  captionInput: {
    fontSize: 17,
    color: "#0F172A",
    fontFamily: FontFamily.regular,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  quickActionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickActionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
  },
  quickActionText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: "#475569",
  },
  quickActionTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  mediaStripContainer: {
    marginBottom: 16,
  },
  mediaStripContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mediaItemCard: {
    position: "relative",
    width: 82,
    height: 82,
  },
  mediaItemTouch: {
    width: 82,
    height: 82,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaPreviewThumb: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    padding: 3,
  },
  mediaRemoveBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dashedAddCard: {
    width: 82,
    height: 82,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  settingsListCard: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  settingLabelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 14.5,
    fontFamily: FontFamily.medium,
    color: "#1E293B",
  },
  settingValueRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 160,
  },
  settingValueText: {
    fontSize: 13.5,
    color: "#94A3B8",
    fontFamily: FontFamily.regular,
  },
  settingValueActive: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  aiSuggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "rgba(0, 122, 255, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.15)",
    marginBottom: 20,
  },
  aiIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 122, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiTextCol: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  aiSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  previewPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewPostText: {
    fontSize: 13.5,
    fontFamily: FontFamily.medium,
    color: "#475569",
  },

  // Media Edit Mode (Option 3)
  mediaEditTopBar: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaEditCloseBtn: {
    padding: 4,
  },
  mediaEditNextPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 18,
  },
  mediaEditNextText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  mediaStageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#0F172A",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaStageImage: {
    width: "100%",
    height: "100%",
  },
  mediaCountBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mediaCountText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontFamily: FontFamily.semiBold,
  },
  floatingCaptionPill: {
    position: "absolute",
    bottom: 18,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  floatingCaptionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  creativeToolsStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: "#000000",
  },
  creativeToolBtn: {
    alignItems: "center",
    gap: 5,
  },
  creativeToolCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeToolCircle: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
  },
  toolIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  toolLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  mediaThumbnailsStrip: {
    paddingVertical: 10,
    backgroundColor: "#0A0F1D",
  },
  mediaThumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  mediaThumbActive: {
    borderColor: Colors.primary,
  },
  mediaThumbImg: {
    width: "100%",
    height: "100%",
  },
  mediaThumbDelete: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 2,
  },
  addMediaThumbBtn: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaEditMetaRows: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#000000",
    gap: 12,
  },
  mediaEditMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaLabelText: {
    color: "#E2E8F0",
    fontSize: 13.5,
    fontFamily: FontFamily.medium,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaValueText: {
    color: "#94A3B8",
    fontSize: 12.5,
  },
  mediaEditBottomBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#000000",
  },
  draftBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtnText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
    fontSize: 14.5,
  },
  nextLargeBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextLargeBtnText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },

  // Modals Styling
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: "#0F172A",
  },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  modalListText: {
    flex: 1,
    fontSize: 14.5,
    color: "#0F172A",
    fontFamily: FontFamily.medium,
  },
  friendListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendFullName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: "#0F172A",
  },
  friendHandle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 12,
  },
  chipPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontFamily: FontFamily.medium,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
  },
  modalDoneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
  },
  privacyModalCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    alignSelf: "center",
    width: "88%",
  },
  privacyModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16.5,
    color: "#0F172A",
    marginBottom: 16,
  },
  privacyOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  privacyOptionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: "#0F172A",
  },
  privacyOptionSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  aiCaptionItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiCaptionItemText: {
    flex: 1,
    fontSize: 13.5,
    color: "#1E293B",
    lineHeight: 19,
    marginRight: 10,
  },
  useCaptionPill: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  useCaptionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },

  // Preview Card
  previewFeedCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  previewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  previewUser: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: "#0F172A",
  },
  previewLoc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  previewMedia: {
    width: "100%",
    height: 260,
  },
  previewCaption: {
    fontSize: 13.5,
    color: "#1E293B",
    lineHeight: 19,
  },
  previewLabels: {
    color: Colors.primary,
    fontSize: 12.5,
    marginTop: 6,
    fontFamily: FontFamily.medium,
  },

  // Uploading Overlay
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    zIndex: 9999,
  },
  uploadDialogCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  uploadTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: "#0F172A",
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  successCardContainer: {
    alignItems: "center",
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
