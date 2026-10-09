import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Linking,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { AppText } from "../components/common/AppText";
import { PlaceMap, type MapRegion, type PlaceMapHandle } from "../components/map/PlaceMap";
import { FontFamily, withAlpha } from "../constants/theme";
import { FALLBACK_REGION } from "../constants/places";
import { describeCoords, getCurrentPlace, searchPlaces } from "../hooks/useDeviceLocation";
import {
  getRecentPlaces,
  rememberPlace,
  settlePlace,
  type PickedPlace,
} from "../services/placePicker";

interface SearchHit {
  label: string;
  latitude: number;
  longitude: number;
}

type ListItem =
  | { kind: "current" }
  | { kind: "recent"; place: PickedPlace }
  | { kind: "hit"; hit: SearchHit };

const LABEL_DEBOUNCE_MS = 400;
const SEARCH_DEBOUNCE_MS = 350;
const CAMERA_MS = 450;
/** Zoom used when we jump to a concrete fix/place (~city-block level). */
const FOCUS_DELTA = 0.03;
/** Zoom used for the first paint from a last-known fix. */
const FIX_DELTA = 0.02;

/**
 * Full-screen, in-app place picker.
 *
 * Renders the platform's map — Apple Maps on iOS, free OpenStreetMap on Android
 * (with no API key or watermark required) — so the user never leaves the app.
 *
 * The chosen place is handed back to the composer through the promise
 * returned by `requestPlace()`.
 */
export default function LocationPickerScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; label?: string }>();
  const mapRef = useRef<PlaceMapHandle>(null);

  /* ---------------------------------------------------------------- */
  /* State                                                             */
  /* ---------------------------------------------------------------- */

  const [region, setRegion] = useState<MapRegion>(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    const hasInitial = Number.isFinite(lat) && Number.isFinite(lng) && Boolean(params.lat);
    return hasInitial
      ? { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : FALLBACK_REGION;
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Boolean(params.lat)
      ? { latitude: lat, longitude: lng }
      : null;
  });
  const [label, setLabel] = useState<string | null>(params.label ?? null);
  /** Whether the map is allowed to mount yet — see the mount effect. */
  const [ready, setReady] = useState(false);

  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [showsUser, setShowsUser] = useState(false);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [recent, setRecent] = useState<PickedPlace[]>([]);

  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedQuery = query.trim();
  const showSearch = focused && trimmedQuery.length >= 2;

  /* ---------------------------------------------------------------- */
  /* Helpers                                                           */
  /* ---------------------------------------------------------------- */

  const flyTo = useCallback(
    (point: { latitude: number; longitude: number }, delta: number) => {
      const next: MapRegion = {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
      setRegion(next);
      setCoords({ latitude: point.latitude, longitude: point.longitude });
      mapRef.current?.animateToRegion(next, CAMERA_MS);
    },
    []
  );

  /** Debounced reverse-geocode of whatever the map's centre currently is. */
  const scheduleLabel = useCallback((point: { latitude: number; longitude: number }) => {
    if (labelTimer.current) clearTimeout(labelTimer.current);
    setGeocoding(true);
    labelTimer.current = setTimeout(async () => {
      const next = await describeCoords(point);
      setLabel(next);
      setGeocoding(false);
    }, LABEL_DEBOUNCE_MS);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Mount: recents, then resolve a starting region before the map      */
  /* renders (avoids loading a whole-world view we immediately animate  */
  /* away from, which is what made the Android map feel slow).          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const places = await getRecentPlaces();
      if (!cancelled && places.length > 0) setRecent(places);

      if (!params.lat) {
        try {
          const permission = await Location.getForegroundPermissionsAsync();
          if (cancelled) return;
          if (permission.granted) {
            setShowsUser(true);
            // Last-known is instant; the fresh fix is left to "Use my
            // current location" so the map paints immediately.
            const last = await Location.getLastKnownPositionAsync({
              maxAge: 10 * 60 * 1000,
              requiredAccuracy: 5000,
            });
            if (!cancelled && last) {
              const point = {
                latitude: last.coords.latitude,
                longitude: last.coords.longitude,
              };
              setRegion({ ...point, latitudeDelta: FIX_DELTA, longitudeDelta: FIX_DELTA });
              setCoords(point);
            }
          }
        } catch {
          // Permission state is a nicety — the picker still works without it.
        }
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      if (labelTimer.current) clearTimeout(labelTimer.current);
      // Back gesture / unmount without confirming = cancel.
      settlePlace(null);
    };
  }, [params.lat]);

  /* ---------------------------------------------------------------- */
  /* Search (debounced, never blocks the map)                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!showSearch) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const hits = await searchPlaces(trimmedQuery);
      if (cancelled) return;
      setResults(hits);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showSearch, trimmedQuery]);

  const handleRegionChangeComplete = useCallback(
    (next: MapRegion) => {
      // Only track the centre — updating `region` here would re-render the map
      // on every pan and make tile loading stutter on Android.
      const point = { latitude: next.latitude, longitude: next.longitude };
      setCoords(point);
      scheduleLabel(point);
    },
    [scheduleLabel]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (locating) return;
    Keyboard.dismiss();
    setLocating(true);
    setPlaceError(null);
    setBlocked(false);

    const result = await getCurrentPlace();
    setLocating(false);

    if (!result.ok) {
      if (result.reason === "blocked") setBlocked(true);
      setPlaceError(result.message);
      return;
    }

    setShowsUser(true);
    flyTo({ latitude: result.place.latitude, longitude: result.place.longitude }, FIX_DELTA);
    setLabel(result.place.label ?? "Current location");
  }, [flyTo, locating]);

  const pickPlace = useCallback(
    (place: { label: string; latitude: number; longitude: number }) => {
      Keyboard.dismiss();
      setFocused(false);
      setQuery("");
      flyTo({ latitude: place.latitude, longitude: place.longitude }, FOCUS_DELTA);
      setLabel(place.label);
      setPlaceError(null);
    },
    [flyTo]
  );

  const confirm = useCallback(() => {
    if (!coords) return;
    const resolvedLabel =
      label ?? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    const picked: PickedPlace = {
      location: resolvedLabel,
      location_lat: Number(coords.latitude.toFixed(6)),
      location_lng: Number(coords.longitude.toFixed(6)),
    };
    rememberPlace(picked);
    settlePlace(picked);
    router.back();
  }, [coords, label, router]);

  const cancel = useCallback(() => {
    settlePlace(null);
    router.back();
  }, [router]);

  /** Whether a stored recent place is the one currently under the pin. */
  const isSelected = useCallback(
    (place: PickedPlace) =>
      coords != null &&
      Math.abs(coords.latitude - place.location_lat) < 1e-6 &&
      Math.abs(coords.longitude - place.location_lng) < 1e-6,
    [coords]
  );

  /* ---------------------------------------------------------------- */
  /* Drag-to-close on Android & iOS                                  */
  /* ---------------------------------------------------------------- */

  const dragY = useRef(new Animated.Value(0)).current;

  const handleDragClose = () => {
    Animated.timing(dragY, {
      toValue: 700,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      cancel();
    });
  };

  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.4) {
          handleDragClose();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const listItems: ListItem[] = showSearch
    ? results.map((hit) => ({ kind: "hit" as const, hit }))
    : [
        { kind: "current" as const },
        ...recent.map((place) => ({ kind: "recent" as const, place })),
      ];

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.background, transform: [{ translateY: dragY }] }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header: Cancel · title · Save (matches Edit Bio) ───── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
        {...headerPanResponder.panHandlers}
      >
        {/* Subtle top grab bar for intuitive drag-to-close gesture */}
        <View style={styles.topGrabWrap}>
          <View style={[styles.topGrabBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={cancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel location picker"
          >
            <AppText weight="medium" style={[styles.headerCancelText, { color: colors.textSecondary }]}>
              Cancel
            </AppText>
          </TouchableOpacity>

          <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Choose a place
          </AppText>

          <TouchableOpacity
            style={[styles.headerAction, styles.headerActionEnd]}
            onPress={confirm}
            disabled={!coords}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Save place"
          >
            <AppText
              weight="bold"
              style={[styles.headerSaveText, { color: coords ? colors.primary : colors.textMuted }]}
            >
              Save
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── Search ───────────────────────────────────────────── */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surfaceHighlight,
              borderColor: focused ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            value={focused ? query : (label ?? "")}
            onChangeText={(text) => {
              setQuery(text);
              setSearching(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search places or cities…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search places"
          />
          {searching && showSearch ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (label ?? query) ? (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setLabel(null);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear place"
            >
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {placeError ? (
          <View style={[styles.errorRow, { backgroundColor: withAlpha(colors.danger, 0.1) }]}>
            <Ionicons name="alert-circle" size={15} color={colors.danger} />
            <AppText variant="caption" color="textSecondary" style={styles.errorText}>
              {placeError}
            </AppText>
            {blocked ? (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <AppText variant="caption" weight="bold" color="primary">
                  Settings
                </AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* ── Map (Apple Maps on iOS · Free OpenStreetMap on Android) ─── */}
      {ready ? (
        <View style={styles.mapWrap}>
          <PlaceMap
            ref={mapRef}
            initialRegion={region}
            showsUserLocation={showsUser}
            userLocation={coords}
            dark={isDark}
            onRegionChangeComplete={handleRegionChangeComplete}
            accessibilityLabel="Map"
          />

          {/* Fixed centre pin — the map moves underneath it. */}
          <View style={styles.pinWrap} pointerEvents="none">
            <View style={styles.pinInner}>
              <View style={[styles.pinHalo, { backgroundColor: withAlpha(colors.primary, 0.18) }]} />
              <Ionicons name="location" size={34} color={colors.primary} style={styles.pinGlyph} />
            </View>
          </View>

          {geocoding ? (
            <View
              style={[
                styles.geocodePill,
                { backgroundColor: withAlpha(colors.background, 0.92), borderColor: colors.border },
              ]}
              pointerEvents="none"
            >
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <AppText variant="caption" color="textSecondary">
                Locating place…
              </AppText>
            </View>
          ) : label ? (
            <View
              style={[
                styles.geocodePill,
                { backgroundColor: withAlpha(colors.background, 0.92), borderColor: colors.border },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="pricetag" size={13} color={colors.primary} />
              <AppText variant="caption" weight="semibold" color="textPrimary" numberOfLines={1}>
                {label}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" color="textMuted">
            Loading map…
          </AppText>
        </View>
      )}

      {/* ── Bottom list: current location + previous places ────── */}
      <View
        style={[
          styles.sheetList,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View
          style={styles.grabberTouchWrap}
          {...headerPanResponder.panHandlers}
        >
          <View style={[styles.grabber, { backgroundColor: withAlpha(colors.textSecondary, 0.4) }]} />
        </View>

        {!showSearch && recent.length > 0 ? (
          <AppText
            variant="caption"
            weight="bold"
            color="textMuted"
            style={styles.sectionLabel}
          >
            Previous places
          </AppText>
        ) : null}

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {listItems.length === 0 ? (
            <AppText variant="bodySmall" color="textMuted" style={styles.emptyText}>
              No matching places — pan the map and drop the pin where you are.
            </AppText>
          ) : null}

          {listItems.map((item, index) => {
            const isLast = index === listItems.length - 1;

            if (item.kind === "current") {
              return (
                <TouchableOpacity
                  key="current"
                  style={[
                    styles.row,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                  onPress={handleUseCurrentLocation}
                  disabled={locating}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Use my current location"
                >
                  <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                    {locating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="navigate" size={16} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.rowText}>
                    <AppText weight="semibold" style={[styles.rowTitle, { color: colors.textPrimary }]}>
                      Use my current location
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      Get GPS coordinates from this device
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            }

            if (item.kind === "recent") {
              const selected = isSelected(item.place);
              return (
                <TouchableOpacity
                  key={`recent-${item.place.location}-${item.place.location_lat}`}
                  style={[
                    styles.row,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                  onPress={() =>
                    pickPlace({
                      label: item.place.location,
                      latitude: item.place.location_lat,
                      longitude: item.place.location_lng,
                    })
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${item.place.location} on the map`}
                >
                  <View
                    style={[
                      styles.rowIcon,
                      {
                        backgroundColor: selected
                          ? withAlpha(colors.primary, 0.12)
                          : colors.surfaceHighlight,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <AppText weight="semibold" style={[styles.rowTitle, { color: colors.textPrimary }]}>
                      {item.place.location}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      Tap to show on the map
                    </AppText>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={`hit-${item.hit.latitude}-${item.hit.longitude}-${index}`}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => pickPlace(item.hit)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Search result ${item.hit.label}`}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.surfaceHighlight }]}>
                  <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.rowText}>
                  <AppText weight="semibold" style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    {item.hit.label}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {item.hit.latitude.toFixed(3)}, {item.hit.longitude.toFixed(3)}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGrabWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 6,
  },
  topGrabBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  grabberTouchWrap: {
    paddingVertical: 5,
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    minWidth: 64,
    paddingVertical: 6,
  },
  headerActionEnd: {
    alignItems: "flex-end",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: FontFamily.bold,
  },
  headerCancelText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  headerSaveText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    paddingVertical: 0,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  errorText: { flex: 1 },

  mapWrap: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pinWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 40,
    height: 40,
  },
  pinHalo: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    top: -8,
    left: -8,
  },
  pinGlyph: {
    position: "absolute",
    bottom: 20,
  },
  geocodePill: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "86%",
    alignSelf: "center",
  },

  sheetList: {
    maxHeight: 260,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
    letterSpacing: 0.3,
  },
  listScroll: { flexGrow: 0 },
  listContent: { paddingHorizontal: 6, paddingVertical: 4 },
  emptyText: { paddingHorizontal: 12, paddingVertical: 12 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    minHeight: 56,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14.5, fontFamily: FontFamily.semiBold },
});
