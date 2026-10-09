import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Modal,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppText } from "./AppText";
import { FontFamily } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { authStorage, StoredUser } from "../../services/authStorage";
import { userService } from "../../services/userService";
import { showAlert } from "../../services/alertService";
import { resolveAvatarSource, DEFAULT_AVATAR } from "../../utils/mediaHelper";

export interface SwitchAccountUser {
  username?: string;
  fullName?: string;
  avatar?: any;
}

export interface SwitchAccountModalProps {
  visible: boolean;
  onClose: () => void;
  user?: SwitchAccountUser | null;
}

export function SwitchAccountModal({ visible, onClose, user }: SwitchAccountModalProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  // Load user data if not provided
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const u = await authStorage.getUser();
        if (mounted && u) setCurrentUser(u);
      } catch (_) {}
    };
    if (visible) {
      loadUser();
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      Haptics.impactAsync(style);
    } catch (_) {}
  };

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      sheetAnim.setValue(0);
      Animated.spring(sheetAnim, {
        toValue: 1,
        tension: 75,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(dragY, {
        toValue: 420,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dragY.setValue(0);
      onClose();
      if (callback) callback();
    });
  };

  const panResponder = useRef(
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
        if (gestureState.dy > 70 || gestureState.vy > 0.35) {
          handleClose();
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

  // Resolve active display info
  const displayUsername = user?.username || currentUser?.username || "profile";
  const displayFullName = user?.fullName || currentUser?.full_name || displayUsername;
  const displayAvatar = user?.avatar || (currentUser ? resolveAvatarSource(currentUser.avatar_url) : DEFAULT_AVATAR);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => handleClose()}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: sheetAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => handleClose()}
          />
        </Animated.View>

        {/* Sliding Bottom Sheet Container - Full Sheet Drag-to-Close */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              transform: [
                {
                  translateY: Animated.add(
                    sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [420, 0],
                    }),
                    dragY
                  ),
                },
              ],
            },
          ]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.handleRow}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          {/* Header Row: "Accounts" + Done Button */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <AppText weight="bold" style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Accounts
            </AppText>
            <TouchableOpacity
              onPress={() => handleClose()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <AppText weight="bold" style={[styles.doneButtonText, { color: colors.primary }]}>
                Done
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Current Active Account Card Only */}
          <TouchableOpacity
            style={[
              styles.accountRow,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)" },
            ]}
            activeOpacity={0.8}
            onPress={() => handleClose()}
          >
            <Image
              source={displayAvatar}
              style={[styles.accountAvatar, { borderColor: colors.primary, borderWidth: 2 }]}
            />
            <View style={styles.accountInfo}>
              <View style={styles.accountNameRow}>
                <AppText weight="bold" style={[styles.accountFullName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {displayFullName}
                </AppText>
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} style={{ marginLeft: 4 }} />
              </View>
              <AppText style={[styles.accountHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                @{displayUsername}
              </AppText>
            </View>
            <View style={[styles.activeCheckCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Action: Add an existing account */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              handleClose(() => {
                router.push("/auth/login" as any);
              });
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={18} color={colors.textPrimary} />
            </View>
            <AppText weight="medium" style={[styles.actionLabel, { color: colors.textPrimary }]}>
              Add an existing account
            </AppText>
          </TouchableOpacity>

          {/* Action: Create a new account */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              handleClose(() => {
                router.push("/auth/register" as any);
              });
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="add-circle-outline" size={19} color={colors.textPrimary} />
            </View>
            <AppText weight="medium" style={[styles.actionLabel, { color: colors.textPrimary }]}>
              Create a new account
            </AppText>
          </TouchableOpacity>

          {/* Action: Log out of active account */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              handleClose(() => {
                showAlert("Log Out", `Are you sure you want to log out of @${displayUsername}?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                      await authStorage.clear();
                      router.replace("/auth/login" as any);
                    },
                  },
                ]);
              });
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "transparent" }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <AppText weight="medium" style={[styles.actionLabel, { color: "#EF4444" }]}>
              Log out of @{displayUsername}
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    zIndex: 9998,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  doneButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 14,
  },
  accountNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountFullName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  accountHandle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  activeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
});
