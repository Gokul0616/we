import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { toast, ToastPayload } from "../services/toastService";

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const unsubscribe = toast.subscribe((t) => {
      if (t) {
        setCurrentToast(t);
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 150,
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
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.92,
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

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: Math.max(insets.top, Platform.OS === "ios" ? 20 : 16) + 6,
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
          size={18}
          color={iconInfo.color}
          style={styles.icon}
        />
        <Text style={styles.nativeText} numberOfLines={2}>
          {currentToast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: "center",
    justifyContent: "center",
  },
  nativeCapsule: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "88%",
    backgroundColor: Platform.select({
      ios: "rgba(28, 28, 30, 0.94)",
      android: "#262626",
      default: "#1C1C1E",
    }),
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  nativeCapsuleError: {
    borderColor: "rgba(255, 69, 58, 0.35)",
  },
  icon: {
    marginRight: 9,
  },
  nativeText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
