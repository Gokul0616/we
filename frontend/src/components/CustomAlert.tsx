import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
  BackHandler,
  Vibration,
  useWindowDimensions,
} from "react-native";
import {
  customAlertManager,
  AlertPayload,
  CustomAlertButton,
} from "../services/alertService";
import { FontFamily } from "../constants/theme";
import { AppText } from "./common/AppText";
import { useTheme } from "../context/ThemeContext";

/**
 * Instagram-styled Android Native Alert Dialog Component
 * Replicates Instagram's compact, responsive hairline-divided modal dialog:
 * - Dynamically scaled width based on screen size (compact ~70-74% of screen width)
 * - Tight, balanced padding (reduced vertical spacing)
 * - Full-width stacked action rows with subtle hairline dividers
 * - Distinct Instagram red (#ED4956) for destructive actions
 */
export function CustomAlert() {
  // On iOS, native Alert.alert is used. This component is strictly for Android.
  if (Platform.OS === "ios") {
    return null;
  }

  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  // Responsive compact width: scales proportionally with screen, bounded between 248px and 276px
  const dialogWidth = Math.min(Math.max(screenWidth * 0.72, 248), 276);

  const [alertData, setAlertData] = useState<AlertPayload | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const unsubscribe = customAlertManager.subscribe((payload) => {
      if (payload) {
        setAlertData(payload);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.92);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 110,
            useNativeDriver: true,
          }),
        ]).start();

        try {
          Vibration.vibrate(15);
        } catch (_) {}
      } else {
        closeAlert();
      }
    });

    return unsubscribe;
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    if (!alertData) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (alertData.options?.cancelable !== false) {
          closeAlert();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [alertData]);

  const closeAlert = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAlertData(null);
      if (callback) callback();
      alertData?.options?.onDismiss?.();
    });
  };

  const handleButtonPress = (btn: CustomAlertButton) => {
    closeAlert(() => {
      btn.onPress?.();
    });
  };

  if (!alertData) {
    return null;
  }

  const buttons = alertData.buttons || [];

  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      onRequestClose={() => {
        if (alertData.options?.cancelable !== false) {
          closeAlert();
        }
      }}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Soft Dim Backdrop with Tap to Dismiss */}
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (alertData.options?.cancelable !== false) {
                closeAlert();
              }
            }}
          />
        </Animated.View>

        {/* Compact Instagram Responsive Dialog Card */}
        <Animated.View
          style={[
            styles.instagramCard,
            {
              backgroundColor: isDark ? "#18181B" : "#FFFFFF",
              width: dialogWidth,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Title & Subtitle with Tight Spacing */}
          <View style={styles.headerSection}>
            <AppText
              variant="subheading"
              align="center"
              style={[styles.titleText, { color: colors.textPrimary }]}
            >
              {alertData.title}
            </AppText>
            {alertData.message ? (
              <AppText
                variant="caption"
                align="center"
                style={[styles.messageText, { color: colors.textSecondary }]}
              >
                {alertData.message}
              </AppText>
            ) : null}
          </View>

          {/* Full-width Stacked Action Rows separated by Hairline Dividers */}
          <View style={styles.actionsList}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";

              return (
                <TouchableOpacity
                  key={`btn-${index}`}
                  activeOpacity={0.6}
                  onPress={() => handleButtonPress(btn)}
                  style={[
                    styles.actionRow,
                    { borderTopColor: isDark ? "#27272A" : "#E2E8F0" },
                  ]}
                >
                  <AppText
                    align="center"
                    style={[
                      styles.actionText,
                      isDestructive && styles.destructiveText,
                      isCancel && [styles.cancelText, { color: colors.textPrimary }],
                      !isDestructive && !isCancel && [styles.defaultText, { color: colors.primary }],
                    ]}
                  >
                    {btn.text}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  instagramCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  headerSection: {
    paddingTop: 18,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  titleText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: "#737373",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 5,
    paddingHorizontal: 4,
  },
  actionsList: {
    width: "100%",
  },
  actionRow: {
    width: "100%",
    height: 43,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 13.5,
    textAlign: "center",
  },
  destructiveText: {
    fontFamily: FontFamily.bold,
    color: "#ED4956", // Instagram signature action red
  },
  defaultText: {
    fontFamily: FontFamily.bold,
    color: "#0095F6", // Instagram signature action blue
  },
  cancelText: {
    fontFamily: FontFamily.regular,
    color: "#0F172A", // Dark neutral cancel
    fontSize: 13,
  },
});
