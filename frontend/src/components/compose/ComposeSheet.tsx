import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../common/AppText";
import { FontFamily, withAlpha } from "../../constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ComposeSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Sheet body — typically the rows/chips of a picker. */
  children: React.ReactNode;
  /** When true the body is wrapped in a ScrollView (default). Set false for static lists. */
  scrollable?: boolean;
  /** Cap on sheet height (defaults to 76% of the screen). */
  maxHeight?: number;
}

/**
 * Theme-adaptive bottom sheet used by every picker on the compose screen.
 *
 * Replaces the old inline trays that were spliced into the ScrollView and made
 * the caption jump around. Backdrop tap / Android back / the ✕ all close it.
 */
export function ComposeSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scrollable = true,
  maxHeight = SCREEN_HEIGHT * 0.76,
}: ComposeSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [slide] = useState(() => new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible) {
      slide.setValue(SCREEN_HEIGHT);
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 320,
        damping: 34,
        mass: 0.8,
      }).start();
    } else {
      slide.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slide]);

  const bodyPaddingBottom = Math.max(insets.bottom, 14) + 12;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.flex}>
        {/* Backdrop */}
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close sheet"
          accessibilityRole="button"
        />

        <KeyboardAvoidingView
          style={styles.sheetHost}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                maxHeight,
                paddingBottom: bodyPaddingBottom,
                shadowColor: colors.black,
                transform: [{ translateY: slide }],
              },
            ]}
          >
            {/* Grab handle */}
            <View
              style={[styles.grabber, { backgroundColor: withAlpha(colors.textSecondary, 0.45) }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.headerTextCol}>
                <AppText
                  weight="bold"
                  style={[styles.title, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {title}
                </AppText>
                {subtitle ? (
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {subtitle}
                  </AppText>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}
                accessibilityLabel={`Close ${title}`}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            {scrollable ? (
              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.body}>{children}</View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Standard selectable row used by the sheets (icon · label · description · check). */
export function SheetOptionRow({
  icon,
  label,
  description,
  selected,
  onPress,
  isLast,
}: {
  icon: string;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.optionRow,
        {
          backgroundColor: selected ? withAlpha(colors.primary, 0.1) : "transparent",
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.surfaceHighlight }]}>
        <Ionicons name={icon as any} size={17} color={selected ? colors.primary : colors.textSecondary} />
      </View>

      <View style={styles.optionTextCol}>
        <AppText
          weight={selected ? "bold" : "semibold"}
          style={[styles.optionLabel, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" style={styles.optionDesc} color="textSecondary" numberOfLines={1}>
            {description}
          </AppText>
        ) : null}
      </View>

      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={selected ? colors.primary : colors.border}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetHost: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 24,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 10,
  },
  bodyContent: {
    paddingVertical: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  optionLabel: {
    fontSize: 14.5,
    fontFamily: FontFamily.semiBold,
  },
  optionDesc: {
    marginTop: 1,
  },
});

export default ComposeSheet;
