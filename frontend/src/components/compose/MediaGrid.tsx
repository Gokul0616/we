import React from "react";
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../common/AppText";
import { AppImage } from "../common/AppImage";
import { FontFamily, withAlpha } from "../../constants/theme";

export interface MediaGridItem {
  id: string;
  uri: string;
  type: "photo" | "video";
  duration?: number;
}

export interface MediaGridProps {
  medias: MediaGridItem[];
  /** Per-media upload progress (0..1). Missing entry = not uploading. */
  progressById?: Record<string, number>;
  onRemove: (id: string) => void;
  onAdd: () => void;
  max?: number;
  /** Overall counter shown on the "add" tile, e.g. "3/10". */
  countLabel?: string;
}

const GAP = 8;
const MIN_TILE = 104;

function formatDuration(ms?: number) {
  if (!ms || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 3-up square media grid for the composer (replaces the old horizontal rail).
 *
 * - Tiles auto-size to the viewport (`useWindowDimensions`) so the grid stays
 *   3-up on phones and 4-up on tablets while respecting a minimum tile width
 * - Per-tile determinate upload progress
 * - Video tiles render a themed placeholder + play glyph + duration instead of
 *   pointing an image loader at an mp4
 * - Order badge, remove badge, dashed "add" tile with the running count
 */
export function MediaGrid({
  medias,
  progressById,
  onRemove,
  onAdd,
  max = 10,
  countLabel,
}: MediaGridProps) {
  const { colors, isDark } = useTheme();
  const { width: screenW } = useWindowDimensions();

  const contentW = screenW - 32; // matches the composer's horizontal padding
  const columns = Math.max(3, Math.min(6, Math.floor((contentW + GAP) / (MIN_TILE + GAP))));
  const tile = Math.floor((contentW - GAP * (columns - 1)) / columns);
  const canAdd = medias.length < max;

  return (
    <View style={[styles.grid, { columnGap: GAP, rowGap: GAP }]}>
      {medias.map((item, index) => {
        const rawProgress = progressById?.[item.id];
        const isUploading = typeof rawProgress === "number" && rawProgress < 1;
        const pct = typeof rawProgress === "number" ? Math.round(rawProgress * 100) : 0;
        const duration = formatDuration(item.duration);

        return (
          <View
            key={item.id}
            style={[
              styles.tile,
              {
                width: tile,
                height: tile,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.black,
              },
            ]}
          >
            {item.type === "video" ? (
              <View style={[styles.videoPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                <View
                  style={[
                    styles.playCircle,
                    {
                      backgroundColor: isDark
                        ? withAlpha(colors.white, 0.14)
                        : withAlpha(colors.black, 0.7),
                    },
                  ]}
                >
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <AppImage source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
            )}

            {/* Order badge */}
            {medias.length > 1 && (
              <View style={[styles.orderBadge, { backgroundColor: colors.overlayDark }]}>
                <AppText weight="bold" style={styles.badgeText}>
                  {index + 1}
                </AppText>
              </View>
            )}

            {/* Remove */}
            <TouchableOpacity
              style={[styles.removeBadge, { backgroundColor: colors.overlayDark }]}
              onPress={() => onRemove(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Remove media ${index + 1}`}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Video duration */}
            {item.type === "video" && duration && !isUploading && (
              <View style={[styles.durationBadge, { backgroundColor: colors.overlayDark }]}>
                <Ionicons name="videocam" size={11} color="#FFFFFF" />
                <AppText weight="bold" style={styles.badgeText}>
                  {duration}
                </AppText>
              </View>
            )}

            {/* Upload progress */}
            {isUploading && (
              <View style={[styles.progressOverlay, { backgroundColor: colors.overlay }]}>
                <AppText weight="bold" style={styles.progressText}>
                  {pct}%
                </AppText>
              </View>
            )}
            <View style={[styles.progressTrack, { backgroundColor: withAlpha(colors.black, 0.25) }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.max(3, Math.min(100, pct))}%`,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}

      {canAdd && (
        <TouchableOpacity
          style={[
            styles.addTile,
            {
              width: tile,
              height: tile,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={onAdd}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add more photos or videos"
        >
          <View style={[styles.addIconCircle, { backgroundColor: colors.surfaceHighlight }]}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </View>
          <AppText weight="semibold" style={[styles.addLabel, { color: colors.textSecondary }]}>
            Add
          </AppText>
          {countLabel ? (
            <AppText variant="caption" color="textMuted">
              {countLabel}
            </AppText>
          ) : null}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tile: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 10,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  addTile: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
});

export default MediaGrid;
