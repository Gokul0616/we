import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { toast, ToastPayload } from "../services/toastService";
import { AppText } from "./common/AppText";
import { FontFamily } from "../constants/theme";

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const unsubscribe = toast.subscribe((t) => {
      if (t) {
        setCurrentToast(t);
        // Reset starting position before springing down
        translateY.setValue(-80);
        opacity.setValue(0);
        scale.setValue(0.9);

        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 14,
            stiffness: 160,
            mass: 0.8,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 160,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.9,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentToast(null);
        });
      }
    });

    return () => unsubscribe();
  }, [translateY, opacity, scale]);

  if (!currentToast) return null;

  const isError = currentToast.type === "error";
  const isSuccess = currentToast.type === "success";

  const getIcon = () => {
    if (isError) return { name: "alert-circle" as const, color: "#FF453A" };
    if (isSuccess) return { name: "checkmark-circle" as const, color: "#30D158" };
    return { name: "information-circle" as const, color: "#0A84FF" };
  };

  const iconInfo = getIcon();

  const statusBarOffset = Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0;
  const topPosition = Math.max(insets.top, statusBarOffset, Platform.OS === "ios" ? 44 : 24) + 10;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toastWrapper,
          {
            top: topPosition,
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => toast.hide()}
          style={[styles.nativeCapsule, isError && styles.nativeCapsuleError]}
        >
          <Ionicons
            name={iconInfo.name}
            size={19}
            color={iconInfo.color}
            style={styles.icon}
          />
          <AppText style={styles.nativeText} numberOfLines={3}>
            {currentToast.message}
          </AppText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999999,
    elevation: 999999,
    alignItems: "center",
  },
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  nativeCapsule: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "90%",
    backgroundColor: Platform.select({
      ios: "rgba(28, 28, 30, 0.96)",
      android: "#212124",
      default: "#1C1C1E",
    }),
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 26,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 999999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  nativeCapsuleError: {
    borderColor: "rgba(255, 69, 58, 0.45)",
    backgroundColor: Platform.select({
      ios: "rgba(38, 20, 22, 0.96)",
      android: "#2B1618",
      default: "#261517",
    }),
  },
  icon: {
    marginRight: 9,
  },
  nativeText: {
    fontSize: 13.5,
    fontFamily: FontFamily.semiBold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
