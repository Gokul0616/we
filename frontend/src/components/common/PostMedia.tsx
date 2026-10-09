import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AppImage } from "./AppImage";

export interface PostMediaProps {
  source: any;
  mediaType?: string;
  style?: any;
  resizeMode?: "cover" | "contain";
  isDetailScreen?: boolean;
  autoPlay?: boolean;
  isGrid?: boolean;
  enableZoom?: boolean;
  onZoomChange?: (isZooming: boolean) => void;
  onPress?: () => void;
  onDoubleTapLike?: () => void;
}

export function isVideoSource(source: any, mediaType?: string): boolean {
  if (mediaType === "video" || mediaType === "reel") return true;
  if (!source) return false;
  const uri = typeof source === "string" ? source : source?.uri;
  if (typeof uri === "string") {
    const clean = uri.toLowerCase();
    return clean.endsWith(".mp4") || clean.endsWith(".mov") || clean.includes(".mp4?") || clean.includes(".mov?") || clean.includes("/video");
  }
  return false;
}

function NativeVideoPlayer({
  uri,
  style,
  resizeMode,
  isDetailScreen,
  autoPlay = true,
  isGrid = false,
  isZooming = false,
}: {
  uri: string;
  style: any;
  resizeMode?: string;
  isDetailScreen?: boolean;
  autoPlay?: boolean;
  isGrid?: boolean;
  isZooming?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay && !isGrid);
  const [isMuted, setIsMuted] = useState(!isDetailScreen);
  const [videoLoading, setVideoLoading] = useState(true);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = !isDetailScreen;
    if (autoPlay && !isGrid) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status }: any) => {
      if (status === "readyToPlay" || status === "error") {
        setVideoLoading(false);
      } else if (status === "loading") {
        setVideoLoading(true);
      }
    });
    return () => {
      sub?.remove?.();
    };
  }, [player]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  return (
    <View style={[style, styles.videoWrapper, isZooming && { overflow: "visible" }]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={resizeMode === "contain" ? "contain" : "cover"}
        nativeControls={false}
        pointerEvents="none"
      />

      {/* Instagram-style Video Center Loading Spinner */}
      {videoLoading && !isGrid && (
        <View style={styles.videoLoaderOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      {!isGrid && !isPlaying && !videoLoading && !isZooming && (
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay} activeOpacity={0.8}>
          <View style={styles.playBadge}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {!isGrid && !isDetailScreen && !isZooming && (
        <View style={styles.videoOverlayControls}>
          <TouchableOpacity style={styles.muteBadge} onPress={toggleMute} activeOpacity={0.8}>
            <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {isGrid && (
        <View style={styles.gridVideoIndicator}>
          <Ionicons name="videocam" size={13} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export const PostMedia: React.FC<PostMediaProps> = ({
  source,
  mediaType,
  style,
  resizeMode = "cover",
  isDetailScreen = false,
  autoPlay = true,
  isGrid = false,
  enableZoom,
  onZoomChange,
  onPress,
  onDoubleTapLike,
}) => {
  const isVideo = isVideoSource(source, mediaType);
  const uri = typeof source === "string" ? source : source?.uri;
  const [isZooming, setIsZooming] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  // Zoom Reanimated shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isPinching = useSharedValue(false);

  // Heart burst animation shared values
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const canZoom = (enableZoom ?? (isDetailScreen || !isGrid)) && !isGrid;

  const notifyZoomStart = useCallback(() => {
    setIsZooming(true);
    onZoomChange?.(true);
  }, [onZoomChange]);

  const notifyZoomEnd = useCallback(() => {
    setIsZooming(false);
    onZoomChange?.(false);
  }, [onZoomChange]);

  // Instagram-style double tap heart burst
  const handleDoubleTap = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) { }

    onDoubleTapLike?.();

    setShowHeart(true);
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSpring(1.3, { damping: 10, stiffness: 220 }, (finished) => {
      if (finished) {
        heartScale.value = withTiming(1, { duration: 120 });
      }
    });

    setTimeout(() => {
      heartOpacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(setShowHeart)(false);
        }
      });
    }, 600);
  }, [onDoubleTapLike, heartScale, heartOpacity]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const mediaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Pinch gesture with cancelsTouchesInView for iOS
  const pinchGesture = Gesture.Pinch()
    .cancelsTouchesInView(true)
    .onTouchesDown((e) => {
      // Immediate response on 2 fingers touch down before iOS ScrollView can drag
      if (e.numberOfTouches >= 2) {
        runOnJS(notifyZoomStart)();
      }
    })
    .onStart(() => {
      isPinching.value = true;
      savedScale.value = scale.value;
      runOnJS(notifyZoomStart)();
    })
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(1, Math.min(next, 4.5));
    })
    .onEnd(() => {
      isPinching.value = false;
      scale.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(notifyZoomEnd)();
        }
      });
      translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    });

  // Pan gesture active during zoom
  const panGesture = Gesture.Pan()
    .cancelsTouchesInView(true)
    .averageTouches(true)
    .minPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1.02) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (!isPinching.value) {
        translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
      }
    });

  // Double tap to like
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => {
      runOnJS(handleDoubleTap)();
    });

  // Single tap for post navigation
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      if (onPress) {
        runOnJS(onPress)();
      }
    });

  // Compose gestures
  const pinchPan = Gesture.Simultaneous(pinchGesture, panGesture);
  const taps = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  const composedGesture = canZoom ? Gesture.Race(pinchPan, taps) : taps;

  const renderMediaContent = () => {
    if (isVideo && uri) {
      if (Platform.OS === "web") {
        return (
          <View style={[styles.fullSize, styles.videoWrapper, isZooming && { overflow: "visible" }]}>
            <video
              src={uri}
              autoPlay={autoPlay && !isGrid}
              loop
              muted={!isDetailScreen}
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: resizeMode === "contain" ? "contain" : "cover",
                borderRadius: isZooming ? 0 : (style?.borderRadius || 0),
              }}
            />
            {isGrid && (
              <View style={styles.gridVideoIndicator}>
                <Ionicons name="videocam" size={13} color="#FFFFFF" />
              </View>
            )}
          </View>
        );
      }

      return (
        <NativeVideoPlayer
          uri={uri}
          style={styles.fullSize}
          resizeMode={resizeMode}
          isDetailScreen={isDetailScreen}
          autoPlay={autoPlay}
          isGrid={isGrid}
          isZooming={isZooming}
        />
      );
    }

    // Photo post
    return (
      <AppImage
        source={source}
        style={styles.fullSize}
        resizeMode={resizeMode}
        showLoader={true}
        indicatorSize={isGrid ? "small" : "small"}
      />
    );
  };

  // Full-featured media with Zoom and/or Double-Tap
  if (canZoom || onPress || onDoubleTapLike) {
    return (
      <View
        style={[
          style,
          styles.zoomContainer,
          {
            zIndex: isZooming ? 99999 : 1,
            elevation: isZooming ? 99999 : 0,
            overflow: isZooming ? "visible" : (style?.overflow || "hidden"),
          },
        ]}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.fullSize, mediaAnimatedStyle]}>
            {renderMediaContent()}
          </Animated.View>
        </GestureDetector>

        {/* Instagram Double-Tap Floating Heart Animation */}
        {showHeart && (
          <Animated.View pointerEvents="none" style={[styles.heartOverlay, heartAnimatedStyle]}>
            <Ionicons name="heart" size={96} color="#FFFFFF" style={styles.heartShadow} />
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      {renderMediaContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  videoWrapper: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
  },
  videoLoaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  videoOverlayControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  muteBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 16,
  },
  gridVideoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  zoomContainer: {
    position: "relative",
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  heartOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  heartShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
