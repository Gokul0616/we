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
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = toast.subscribe((t) => {
      if (t) {
        setCurrentToast(t);
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentToast(null);
        });
      }
    });

    return () => unsubscribe();
  }, [translateY, opacity]);

  if (!currentToast) return null;

  const isError = currentToast.type === "error";
  const isSuccess = currentToast.type === "success";

  const getIconName = () => {
    if (isError) return "alert-circle";
    if (isSuccess) return "checkmark-circle";
    return "information-circle";
  };

  const getAccentColor = () => {
    if (isError) return "#EF4444";
    if (isSuccess) return "#10B981";
    return "#3B82F6";
  };

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: Math.max(insets.top, 16) + 4,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toastCard,
          isError && styles.toastCardError,
          isSuccess && styles.toastCardSuccess,
        ]}
      >
        <Ionicons
          name={getIconName()}
          size={22}
          color={getAccentColor()}
          style={styles.icon}
        />
        <Text style={styles.messageText} numberOfLines={3}>
          {currentToast.message}
        </Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => toast.hide()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: "center",
  },
  toastCard: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  toastCardError: {
    backgroundColor: "#18181B",
    borderColor: "#EF4444",
    borderWidth: 1.2,
  },
  toastCardSuccess: {
    backgroundColor: "#18181B",
    borderColor: "#10B981",
    borderWidth: 1.2,
  },
  icon: {
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  closeBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
