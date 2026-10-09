import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
  GestureResponderEvent,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ButtonStyles, Radius } from "../../constants/theme";
import { AppText } from "./AppText";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface AppButtonProps {
  /**
   * Button title text
   */
  title?: string;
  /**
   * Children components (if not passing string title)
   */
  children?: React.ReactNode;
  /**
   * Visual variant: primary, secondary, outline, ghost, danger
   */
  variant?: ButtonVariant;
  /**
   * Size preset: sm, md, lg
   */
  size?: ButtonSize;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Loading state displaying an ActivityIndicator
   */
  loading?: boolean;
  /**
   * Press handler
   */
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * Optional icon component
   */
  icon?: React.ReactNode;
  /**
   * Icon placement relative to label
   */
  iconPosition?: "left" | "right";
  /**
   * Container style override
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Text label style override
   */
  textStyle?: StyleProp<TextStyle>;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Touch opacity on press
   */
  activeOpacity?: number;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onPress,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  accessibilityLabel,
  activeOpacity = 0.85,
}) => {
  const { colors, isDark } = useTheme();

  const isInteractive = !disabled && !loading;

  // Resolve container styles based on variant and theme
  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: isDark ? colors.surfaceHighlight : "#F1F5F9",
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: isDark ? colors.borderLight : colors.border,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      case "danger":
        return {
          backgroundColor: colors.danger,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  // Resolve label color
  const getTextColor = (): string => {
    if (variant === "primary" || variant === "danger") {
      return colors.white;
    }
    if (variant === "outline" || variant === "ghost") {
      return colors.primary;
    }
    return colors.textPrimary;
  };

  // Resolve size heights and paddings
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          height: ButtonStyles.height.sm,
          paddingHorizontal: 12,
          borderRadius: Radius.sm,
        };
      case "lg":
        return {
          height: ButtonStyles.height.lg,
          paddingHorizontal: 24,
          borderRadius: 27,
        };
      case "md":
      default:
        return {
          height: ButtonStyles.height.md,
          paddingHorizontal: 18,
          borderRadius: 24,
        };
    }
  };

  const typo = ButtonStyles.typography[size];

  return (
    <TouchableOpacity
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof title === "string" ? title : undefined)}
      accessibilityState={{ disabled: !isInteractive }}
      style={[
        styles.baseButton,
        getSizeStyle(),
        getVariantContainerStyle(),
        !isInteractive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === "left" ? (
            <View style={styles.leftIcon}>{icon}</View>
          ) : null}

          {title ? (
            <AppText
              style={[
                {
                  fontFamily: typo.fontFamily,
                  fontSize: typo.fontSize,
                  lineHeight: typo.lineHeight,
                  color: getTextColor(),
                },
                textStyle,
              ]}
            >
              {title}
            </AppText>
          ) : (
            children
          )}

          {icon && iconPosition === "right" ? (
            <View style={styles.rightIcon}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default AppButton;
