import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  UIManager,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { FontFamily, withAlpha } from "../constants/theme";
import { AppText } from "../components/common/AppText";
import { MediaGrid, MediaGridItem } from "../components/compose/MediaGrid";
import { PrivacySheet, TagsSheet } from "../components/compose/Sheets";
import { postService } from "../services/postService";
import { requestPlace } from "../services/placePicker";
import { toast } from "../services/toastService";
import { showAlert } from "../services/alertService";
import { draftService, isDraftMeaningful } from "../services/draftService";
import { authStorage, StoredUser } from "../services/authStorage";
import { resolveAvatarSource } from "../utils/mediaHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface SelectedMediaItem extends MediaGridItem {
  id: string;
  uri: string;
  type: "photo" | "video";
  duration?: number;
}

const MAX_MEDIA = 10;
const MAX_TAGS = 8;
const MAX_CHARS = 1000;
const WARNING_AT = 900;

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

type SheetName = "privacy" | "tags" | null;

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedMedias, setSelectedMedias] = useState<SelectedMediaItem[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  /** Coordinates backing `location` — set together by the map picker. */
  const [place, setPlace] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacyIndex, setPrivacyIndex] = useState(0);
  const [addToStory, setAddToStory] = useState(false);

  // Sheets replace the old inline trays → zero layout jump while composing
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);

  // Publishing / upload feedback
  const [isPosting, setIsPosting] = useState(false);
  const [overallProgress, setOverallProgress] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [mediaProgress, setMediaProgress] = useState<Record<string, number>>({});

  // Draft lifecycle
  const [draftReady, setDraftReady] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const progressRef = useRef<Record<string, number>>({});
  // One idempotency key per composition (created lazily on first publish, inside an
  // event handler) — a retry after a timeout returns the original post instead of
  // creating a duplicate.
  const clientPostIdRef = useRef<string | null>(null);

  const currentPrivacy = PRIVACY_OPTIONS[privacyIndex];

  /* ---------------------------------------------------------------- */
  /* Bootstrap: user + draft restore                                   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [user, draft] = await Promise.all([authStorage.getUser(), draftService.load()]);
      if (cancelled) return;

      if (user) setCurrentUser(user);

      if (draft && isDraftMeaningful(draft)) {
        setCaption(draft.caption || "");
        setSelectedMedias((draft.medias || []) as SelectedMediaItem[]);
        setLocation(draft.location || null);
        setPlace(
          typeof draft.location_lat === "number" && typeof draft.location_lng === "number"
            ? { lat: draft.location_lat, lng: draft.location_lng }
            : null
        );
        setSelectedTags(draft.tags || []);
        setAddToStory(Boolean(draft.add_to_story));
        const idx = PRIVACY_OPTIONS.findIndex((o) => o.key === (draft.privacy as any));
        if (idx >= 0) setPrivacyIndex(idx);
        toast.info("Draft restored");
      }
      setDraftReady(true);
    })();

    return () => {
      cancelled = true;
      draftService.cancelPending();
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Auto-save draft                                                   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!draftReady || isPosting) return;
    draftService.saveDebounced({
      caption,
      medias: selectedMedias.map((m) => ({
        id: m.id,
        uri: m.uri,
        type: m.type,
        duration: m.duration,
      })),
      location,
      location_lat: place?.lat ?? null,
      location_lng: place?.lng ?? null,
      tags: selectedTags,
      privacy: currentPrivacy.key,
      add_to_story: addToStory,
    });
  }, [
    caption,
    selectedMedias,
    location,
    place,
    selectedTags,
    privacyIndex,
    addToStory,
    draftReady,
    isPosting,
    currentPrivacy.key,
  ]);

  /* ---------------------------------------------------------------- */
  /* Derived state                                                     */
  /* ---------------------------------------------------------------- */

  const trimmedCaption = caption.trim();
  const hasContent = trimmedCaption.length > 0 || selectedMedias.length > 0;
  const canPost = hasContent && !isPosting;

  const counterColor =
    caption.length >= MAX_CHARS
      ? colors.danger
      : caption.length >= WARNING_AT
        ? colors.warning
        : colors.textMuted;

  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 18 : 12);
  const bottomPadding = Math.max(insets.bottom, 12);

  const haptic = useCallback((ms = 12) => {
    try {
      Vibration.vibrate(ms);
    } catch {
      /* haptics are best-effort */
    }
  }, []);

  /** Softens media tile add/remove (guarded: Android needs the flag). */
  const animateLayout = useCallback(() => {
    try {
      if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      /* layout animation is a nicety */
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /* Media selection                                                   */
  /* ---------------------------------------------------------------- */

  /** Rejects picks that would produce a video/photo mix the feed can't render. */
  const validateAddition = useCallback(
    (incoming: SelectedMediaItem[]): SelectedMediaItem[] | null => {
      const wouldBe = [...selectedMedias, ...incoming];

      const videoCount = wouldBe.filter((m) => m.type === "video").length;
      if (videoCount > 1 || (videoCount === 1 && wouldBe.length > 1)) {
        toast.error("A post can contain either photos or one video");
        return null;
      }
      if (wouldBe.length > MAX_MEDIA) {
        toast.error(`You can attach up to ${MAX_MEDIA} items`);
        return null;
      }
      return incoming;
    },
    [selectedMedias]
  );

  const handlePickMedia = useCallback(async () => {
    if (isPosting) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert(
          "Permission Required",
          "Please grant photo library access in Settings to select photos and videos."
        );
        return;
      }

      const remaining = MAX_MEDIA - selectedMedias.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        orderedSelection: true,
        quality: 0.85,
        selectionLimit: Math.max(1, remaining),
      });

      if (result.canceled || !result.assets?.length) return;

      const incoming: SelectedMediaItem[] = result.assets.map((asset, index) => ({
        id: `media_${Date.now()}_${index}`,
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "photo",
        duration: asset.duration ?? undefined,
      }));

      const validated = validateAddition(incoming);
      if (!validated) return;

      haptic();
      animateLayout();
      setSelectedMedias((prev) => [...prev, ...validated].slice(0, MAX_MEDIA));
    } catch (e) {
      console.log("handlePickMedia error:", e);
      toast.error("Could not access photo library");
    }
  }, [isPosting, selectedMedias, haptic, animateLayout, validateAddition]);

  const handleTakePhoto = useCallback(async () => {
    if (isPosting) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert("Permission Required", "Please allow camera access in Settings to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const incoming: SelectedMediaItem[] = [
        {
          id: `camera_${Date.now()}`,
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "photo",
          duration: asset.duration ?? undefined,
        },
      ];

      const validated = validateAddition(incoming);
      if (!validated) return;

      haptic();
      animateLayout();
      setSelectedMedias((prev) => [...prev, ...validated].slice(0, MAX_MEDIA));
    } catch (e) {
      console.log("handleTakePhoto error:", e);
      toast.error("Could not open camera");
    }
  }, [isPosting, haptic, animateLayout, validateAddition]);

  const handleRemoveMedia = useCallback(
    (id: string) => {
      if (isPosting) return;
      haptic();
      animateLayout();
      setSelectedMedias((prev) => prev.filter((m) => m.id !== id));
      setMediaProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      delete progressRef.current[id];
    },
    [isPosting, haptic, animateLayout]
  );

  /* ---------------------------------------------------------------- */
  /* Location                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Opens the full-screen in-app map picker (Apple Maps on iOS, Google Maps
   * on Android). The route resolves a promise, so the composer's state — and
   * the restored draft — survive the round trip untouched.
   */
  const handlePickLocation = useCallback(async () => {
    if (isPosting) return;
    Keyboard.dismiss();
    haptic();

    const picked = await requestPlace(
      place ? { lat: place.lat, lng: place.lng, label: location ?? undefined } : undefined
    );
    if (!picked) return;

    haptic();
    setLocation(picked.location);
    setPlace({ lat: picked.location_lat, lng: picked.location_lng });
  }, [isPosting, place, location, haptic]);

  const handleRemoveLocation = useCallback(() => {
    if (isPosting) return;
    haptic();
    setLocation(null);
    setPlace(null);
  }, [isPosting, haptic]);

  /* ---------------------------------------------------------------- */
  /* Cancel / discard with draft                                       */
  /* ---------------------------------------------------------------- */

  const handleCancel = () => {
    Keyboard.dismiss();
    if (isPosting) return;

    if (!hasContent) {
      draftService.clear();
      router.back();
      return;
    }

    showAlert(
      "Discard post?",
      "Keep editing, save your work as a draft, or discard it permanently.",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Save Draft",
          style: "default",
          onPress: async () => {
            // Write synchronously with the pending debounce: the screen
            // unmounts right after `router.back()`, which cancels queued writes.
            await draftService.saveNow({
              caption,
              medias: selectedMedias.map((m) => ({
                id: m.id,
                uri: m.uri,
                type: m.type,
                duration: m.duration,
              })),
              location,
              location_lat: place?.lat ?? null,
              location_lng: place?.lng ?? null,
              tags: selectedTags,
              privacy: currentPrivacy.key,
              add_to_story: addToStory,
            });
            toast.success("Draft saved on this device");
            router.back();
          },
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await draftService.clear();
            router.back();
          },
        },
      ]
    );
  };

  /* ---------------------------------------------------------------- */
  /* Publish                                                           */
  /* ---------------------------------------------------------------- */

  const updateProgress = useCallback(
    (id: string, value: number, total: number) => {
      progressRef.current = { ...progressRef.current, [id]: value };
      setMediaProgress(progressRef.current);

      const values = selectedMedias.map((m) => progressRef.current[m.id] ?? 0);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const done = values.filter((v) => v >= 1).length;

      setOverallProgress(0.05 + avg * 0.85);
      setProgressLabel(
        total > 1 ? `Uploading ${done} of ${total}` : "Uploading media"
      );
    },
    [selectedMedias]
  );

  const handlePublish = async () => {
    if (!canPost) return;

    Keyboard.dismiss();
    haptic(20);

    setIsPosting(true);
    progressRef.current = {};
    setMediaProgress({});
    setOverallProgress(0.05);
    setProgressLabel(
      selectedMedias.length > 0 ? `Uploading 1 of ${selectedMedias.length}` : "Publishing"
    );

    try {
      // 1. Parallel upload with per-file progress
      let uploadedUrls: string[] = [];
      if (selectedMedias.length > 0) {
        const settled = await Promise.allSettled(
          selectedMedias.map(async (item, index) => {
            const url = await postService.uploadMedia(item.uri, item.type, (p) =>
              updateProgress(item.id, p, selectedMedias.length)
            );
            updateProgress(item.id, 1, selectedMedias.length);
            return { id: item.id, index, url };
          })
        );

        const failures = settled.filter((r) => r.status === "rejected");
        const successes = settled
          .filter((r): r is PromiseFulfilledResult<{ id: string; index: number; url: string }> =>
            r.status === "fulfilled"
          )
          .map((r) => r.value);

        // Persist the remote URLs we already paid for so a retry skips them
        if (successes.length > 0) {
          const byId = new Map(successes.map((s) => [s.id, s.url]));
          setSelectedMedias((prev) =>
            prev.map((m) => (byId.has(m.id) ? { ...m, uri: byId.get(m.id)! } : m))
          );
        }

        if (failures.length > 0) {
          throw new Error(
            successes.length > 0
              ? `${failures.length} file(s) failed to upload — the rest are kept, tap Post to retry.`
              : "Couldn't upload your media. Check your connection and try again."
          );
        }

        uploadedUrls = successes.sort((a, b) => a.index - b.index).map((s) => s.url);
      }

      // 2. Derive media_type from what actually got uploaded
      const mediaType =
        uploadedUrls.length === 0
          ? "none"
          : uploadedUrls.length > 1
            ? "carousel"
            : selectedMedias[0]?.type === "video"
              ? "video"
              : "photo";

      setOverallProgress(0.95);
      setProgressLabel("Publishing");

      if (!clientPostIdRef.current) {
        clientPostIdRef.current = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }

      // 3. Create post (sync engine → HTTP fallback → local object)
      await postService.createPost({
        content: trimmedCaption,
        media_url: uploadedUrls[0],
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        media_type: mediaType as any,
        // Backend requires both-or-neither for coords and labels them with the
        // place label; fall back to a coordinate string if geocoding failed.
        location:
          location ||
          (place ? `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}` : undefined),
        location_lat: place?.lat,
        location_lng: place?.lng,
        tags: selectedTags,
        privacy: currentPrivacy.key as any,
        add_to_story: addToStory,
        client_post_id: clientPostIdRef.current,
      });

      setOverallProgress(1);
      await draftService.clear();

      toast.success("Post shared successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.log("Post creation error:", e);
      toast.error(e?.message || "Failed to publish post. Please try again.");
      setIsPosting(false);
      setOverallProgress(null);
      setProgressLabel("");
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const openSheet = (sheet: Exclude<SheetName, null>) => {
    Keyboard.dismiss();
    setActiveSheet((current) => (current === sheet ? null : sheet));
  };

  const authorName = currentUser?.full_name || currentUser?.username || "You";
  const authorHandle = currentUser?.username ? `@${currentUser.username}` : null;

  const renderChip = useCallback(
    (node: React.ReactNode, key: string) => (
      <View key={key} style={[styles.chip, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        {node}
      </View>
    ),
    [colors.surfaceHighlight, colors.border]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header: Cancel · title · Share (matches Edit Bio) ── */}
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
          style={styles.headerCancel}
          onPress={handleCancel}
          disabled={isPosting}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel and close"
        >
          <AppText weight="medium" style={[styles.headerCancelText, { color: colors.textSecondary }]}>
            Cancel
          </AppText>
        </TouchableOpacity>

        <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
          New post
        </AppText>

        <TouchableOpacity
          style={[styles.headerSave, { opacity: canPost ? 1 : 0.65 }]}
          onPress={handlePublish}
          disabled={!canPost}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          {isPosting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText
              weight="bold"
              style={[styles.headerSaveText, { color: canPost ? colors.primary : colors.textMuted }]}
            >
              Share
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Determinate upload progress rail ───────────────────── */}
      {overallProgress !== null && (
        <View
          style={[
            styles.progressHost,
            { backgroundColor: colors.background, borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={[styles.progressTrack, { backgroundColor: withAlpha(colors.black, 0.12) }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.round(Math.max(2, Math.min(1, overallProgress)) * 100)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabelRow}>
            <AppText variant="caption" color="textSecondary">
              {progressLabel}
            </AppText>
            <AppText variant="caption" weight="bold" color="primary">
              {Math.round(overallProgress * 100)}%
            </AppText>
          </View>
        </View>
      )}

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
          {/* ── Author + audience ───────────────────────────────── */}
          <View style={styles.authorRow}>
            <Image
              source={resolveAvatarSource(currentUser?.avatar_url)}
              style={[styles.avatar, { backgroundColor: colors.surfaceHighlight }]}
            />

            <View style={styles.authorMeta}>
              <AppText
                weight="bold"
                style={[styles.authorName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {authorName}
              </AppText>
              {authorHandle ? (
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {authorHandle}
                </AppText>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.audiencePill,
                { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
              ]}
              activeOpacity={0.75}
              onPress={() => openSheet("privacy")}
              accessibilityRole="button"
              accessibilityLabel={`Audience: ${currentPrivacy.label}. Change`}
            >
              <Ionicons name={currentPrivacy.icon as any} size={13} color={colors.textSecondary} />
              <AppText
                weight="semibold"
                style={[styles.audiencePillText, { color: colors.textSecondary }]}
              >
                {currentPrivacy.label}
              </AppText>
              <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.hairline, { backgroundColor: colors.borderLight }]} />

          {/* ── Caption: borderless, counter right under it ─────── */}
          <TextInput
            ref={inputRef}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textMuted}
            style={[styles.captionInput, { color: colors.textPrimary }]}
            multiline
            autoFocus
            value={caption}
            onChangeText={setCaption}
            selectionColor={colors.primary}
            maxLength={MAX_CHARS}
            textAlignVertical="top"
            accessibilityLabel="Post caption"
          />

          {(location || selectedTags.length > 0) && (
            <View style={styles.chipsContainer}>
              {location && (
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.chipMain}
                    onPress={handlePickLocation}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Location ${location}. Change on the map`}
                  >
                    <Ionicons name="location-sharp" size={13} color={colors.primary} />
                    <AppText
                      weight="semibold"
                      style={[styles.chipText, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {location}
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove location"
                  >
                    <Ionicons name="close-circle" size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedTags.map((tag) =>
                renderChip(
                  <>
                    <AppText
                      weight="semibold"
                      style={[styles.chipText, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {tag}
                    </AppText>
                    <TouchableOpacity
                      onPress={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove topic ${tag}`}
                    >
                      <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </>,
                  tag
                )
              )}
            </View>
          )}

          <View style={styles.counterRow}>
            <AppText
              variant="caption"
              weight={caption.length >= WARNING_AT ? "bold" : "medium"}
              style={[styles.counter, { color: counterColor }]}
              accessibilityLabel={`${caption.length} of ${MAX_CHARS} characters`}
            >
              {caption.length}/{MAX_CHARS}
            </AppText>
          </View>

          <View style={[styles.hairline, { backgroundColor: colors.borderLight }]} />

          {/* ── Media grid ──────────────────────────────────────── */}
          {selectedMedias.length > 0 && (
            <View style={styles.mediaSection}>
              <MediaGrid
                medias={selectedMedias}
                progressById={mediaProgress}
                onRemove={handleRemoveMedia}
                onAdd={handlePickMedia}
                max={MAX_MEDIA}
                countLabel={`${selectedMedias.length}/${MAX_MEDIA}`}
              />
            </View>
          )}

          {/* ── Draft status (quiet) ────────────────────────────── */}
          {hasContent && draftReady && (
            <View style={styles.draftRow}>
              <Ionicons name="cloud-done-outline" size={13} color={colors.textMuted} />
              <AppText variant="caption" color="textMuted">
                Draft saved
              </AppText>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom dock: all attach controls, thumb-reachable ──── */}
        <View
          style={[
            styles.dock,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          <DockAction
            icon="images-outline"
            label="Gallery"
            badge={selectedMedias.length > 0 ? `${selectedMedias.length}/${MAX_MEDIA}` : undefined}
            onPress={handlePickMedia}
            disabled={isPosting}
          />
          <DockAction
            icon="camera-outline"
            label="Camera"
            onPress={handleTakePhoto}
            disabled={isPosting}
          />
          <DockAction
            icon="location-outline"
            label="Place"
            active={Boolean(location)}
            onPress={handlePickLocation}
            disabled={isPosting}
          />
          <DockAction
            icon="pricetag-outline"
            label="Topic"
            active={selectedTags.length > 0}
            onPress={() => openSheet("tags")}
            disabled={isPosting}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ── Sheets ─────────────────────────────────────────────── */}
      <PrivacySheet
        visible={activeSheet === "privacy"}
        onClose={() => setActiveSheet(null)}
        options={PRIVACY_OPTIONS}
        selectedIndex={privacyIndex}
        onSelect={(idx) => {
          setPrivacyIndex(idx);
          haptic();
        }}
        addToStory={addToStory}
        onToggleStory={setAddToStory}
      />

      <TagsSheet
        visible={activeSheet === "tags"}
        onClose={() => setActiveSheet(null)}
        selected={selectedTags}
        suggestions={POPULAR_TAGS}
        max={MAX_TAGS}
        onChange={(tags) => {
          setSelectedTags(tags);
          haptic();
        }}
      />
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Flat icon + label control for the bottom dock                     */
/* ---------------------------------------------------------------- */

function DockAction({
  icon,
  label,
  badge,
  onPress,
  active = false,
  disabled = false,
}: {
  icon: string;
  label: string;
  /** Small count pill next to the icon, e.g. "3/10" on Gallery. */
  badge?: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.dockAction, { opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} selected` : label}
    >
      <View style={styles.dockIconWrap}>
        <Ionicons
          name={icon as any}
          size={22}
          color={active ? colors.primary : colors.textSecondary}
        />
        {badge ? (
          <View style={[styles.dockBadge, { backgroundColor: colors.primary }]}>
            <AppText weight="bold" style={[styles.dockBadgeText, { color: colors.white }]}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText
        variant="caption"
        weight={active ? "bold" : "semibold"}
        color={active ? "primary" : "textMuted"}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  /* Header — flat, hairline, Cancel · title · Share (like Edit Bio) */
  header: {
    paddingHorizontal: 16,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCancel: { minWidth: 64, paddingVertical: 6 },
  headerCancelText: { fontSize: 16, fontFamily: FontFamily.medium },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  headerSave: {
    minWidth: 64,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  headerSaveText: { fontSize: 16, fontFamily: FontFamily.bold },

  /* Determinate upload progress */
  progressHost: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },

  /* Author + audience */
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorMeta: {
    flex: 1,
    marginLeft: 11,
    justifyContent: "center",
  },
  authorName: { fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 3 },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 8,
  },
  audiencePillText: { fontSize: 12, fontFamily: FontFamily.semiBold },

  hairline: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },

  /* Caption — borderless, counter directly under it */
  captionInput: {
    fontSize: 17,
    fontFamily: FontFamily.regular,
    lineHeight: 26,
    minHeight: 190,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: 6,
  },
  counter: { fontSize: 12.5 },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: SCREEN_WIDTH * 0.72,
  },
  chipMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  chipText: { fontSize: 13, fontFamily: FontFamily.semiBold, maxWidth: SCREEN_WIDTH * 0.5 },

  mediaSection: {
    marginTop: 16,
  },

  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },

  /* Bottom dock */
  dock: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dockAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
    minHeight: 52,
  },
  dockIconWrap: {
    width: 30,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dockBadge: {
    position: "absolute",
    top: -7,
    right: -16,
    minWidth: 26,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  dockBadgeText: { fontSize: 9.5, fontFamily: FontFamily.bold },
});
