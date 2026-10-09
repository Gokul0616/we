import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from "react-native";
import { Image as ExpoImage, ImageProps as ExpoImageProps } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export interface AppImageProps extends Omit<ExpoImageProps, "style" | "resizeMode"> {
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showLoader?: boolean;
  indicatorSize?: "small" | "large";
  indicatorColor?: string;
  fallbackSource?: any;
  resizeMode?: "cover" | "contain" | "fill" | "center" | "stretch";
}

/**
 * High-performance, Instagram-style progressive image component:
 * - Uses native multi-threaded parallel downloading & memory-disk caching (expo-image).
 * - Photos load in parallel independently — each loader hides immediately when its photo arrives.
 * - Local asset requires (numbers) never show unnecessary spinners.
 * - Built-in safety timeout prevents infinite stuck spinners on network interruptions.
 */
// In-memory cache of loaded image URLs to prevent re-spinning on re-renders/sync updates
const loadedUrls = new Set<string>();

export const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  containerStyle,
  showLoader = true,
  indicatorSize = "small",
  indicatorColor,
  fallbackSource,
  resizeMode = "cover",
  contentFit,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  // If source is a local require(...) asset (number in RN) or null, it's instant and not remote
  const isLocal = typeof source === "number" || !source;
  const uriKey = typeof source === "string" ? source : (source as any)?.uri || "";
  const isAlreadyLoaded = isLocal || !uriKey || loadedUrls.has(uriKey);

  const [loading, setLoading] = useState(!isAlreadyLoaded);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isLocal || !uriKey || loadedUrls.has(uriKey)) {
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    // Safety timeout: Never leave loader spinning indefinitely if network stalls
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [uriKey, isLocal]);

  const handleLoad = () => {
    if (uriKey) loadedUrls.add(uriKey);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
    setError(true);
  };

  const handleLoadEnd = () => {
    if (uriKey) loadedUrls.add(uriKey);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
  };

  const defaultBg = isDark ? "#1A1D24" : "#F1F5F9";
  const spinnerColor = indicatorColor || (isDark ? "#94A3B8" : "#64748B");
  const flattened = StyleSheet.flatten(style) || {};
  const effectiveFit = contentFit || (resizeMode === "contain" ? "contain" : "cover");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: defaultBg,
          borderRadius: flattened.borderRadius || 0,
        },
        containerStyle,
        style,
      ]}
    >
      {/* High-Performance Expo Image with Parallel Caching */}
      {!error && (
        <ExpoImage
          source={source}
          contentFit={effectiveFit}
          transition={150}
          cachePolicy="memory-disk"
          priority="high"
          onLoad={handleLoad}
          onError={handleError}
          onLoadEnd={handleLoadEnd}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: flattened.borderRadius || 0,
            },
          ]}
          {...props}
        />
      )}

      {/* Fallback Image or Error Icon */}
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.centeredFallback, { backgroundColor: defaultBg }]}>
          {fallbackSource ? (
            <ExpoImage
              source={fallbackSource}
              contentFit={effectiveFit}
              style={[StyleSheet.absoluteFill, { borderRadius: flattened.borderRadius || 0 }]}
            />
          ) : (
            <Ionicons name="image-outline" size={22} color={isDark ? "#475569" : "#CBD5E1"} />
          )}
        </View>
      )}

      {/* Instagram-Style Centered Loading Spinner (hides independently per photo) */}
      {showLoader && loading && !isLocal && !error && (
        <View style={[StyleSheet.absoluteFill, styles.loaderOverlay, { backgroundColor: defaultBg }]}>
          <ActivityIndicator size={indicatorSize} color={spinnerColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  loaderOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  centeredFallback: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
