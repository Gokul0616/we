import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
  StyleProp,
} from "react-native";
import {
  FontFamily,
  Typography,
  TypographyVariant,
  ThemeColors,
} from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";

export type FontWeightOption =
  | "regular"
  | "medium"
  | "semibold"
  | "semiBold"
  | "bold"
  | "extrabold"
  | "extraBold";

export interface AppTextProps extends RNTextProps {
  /**
   * Typography variant defined in the design system (theme.ts)
   * Defaults to "body" if not specified.
   */
  variant?: TypographyVariant;
  /**
   * Font weight override. If provided, maps to the appropriate FontFamily.
   */
  weight?: FontWeightOption;
  /**
   * Color name from ThemeColors (e.g. "textPrimary", "primary", "textSecondary") or direct color string.
   */
  color?: keyof ThemeColors | string;
  /**
   * Text alignment convenience prop.
   */
  align?: TextStyle["textAlign"];
  /**
   * Standard React Native style override.
   */
  style?: StyleProp<TextStyle>;
  /**
   * Children nodes to render.
   */
  children?: React.ReactNode;
}

const FONT_FAMILY_BY_WEIGHT: Record<FontWeightOption, string> = {
  regular: FontFamily.regular,
  medium: FontFamily.medium,
  semibold: FontFamily.semiBold,
  semiBold: FontFamily.semiBold,
  bold: FontFamily.bold,
  extrabold: FontFamily.extraBold,
  extraBold: FontFamily.extraBold,
};

const WEIGHT_STRING_MAP: Record<string, string> = {
  "900": FontFamily.extraBold,
  "800": FontFamily.extraBold,
  "700": FontFamily.bold,
  bold: FontFamily.bold,
  "600": FontFamily.semiBold,
  "500": FontFamily.medium,
  "400": FontFamily.regular,
  normal: FontFamily.regular,
  "300": FontFamily.regular,
  "200": FontFamily.regular,
  "100": FontFamily.regular,
};

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  weight,
  color,
  align,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();

  // 1. Resolve base variant typography from theme
  const variantStyle = Typography[variant] || Typography.body;

  // 2. Resolve default color based on active theme
  let resolvedColor: string;
  if (color) {
    if (color in colors) {
      resolvedColor = colors[color as keyof ThemeColors];
    } else {
      resolvedColor = color as string;
    }
  } else {
    // Map default variant color to active theme colors for dark/light consistency
    if (variant === "metadata" || variant === "caption") {
      resolvedColor = colors.textSecondary;
    } else if (variant === "button") {
      resolvedColor = colors.white;
    } else if (variant === "link") {
      resolvedColor = colors.primary;
    } else {
      resolvedColor = colors.textPrimary;
    }
  }

  // 3. Resolve font family from weight prop, or fallback to variant fontFamily
  let resolvedFontFamily: string = variantStyle.fontFamily;
  if (weight) {
    const normalizedWeight = weight.toLowerCase() as FontWeightOption;
    if (FONT_FAMILY_BY_WEIGHT[normalizedWeight]) {
      resolvedFontFamily = FONT_FAMILY_BY_WEIGHT[normalizedWeight];
    }
  }

  // 4. Flatten user style to sanitize conflicting font families / weights
  const flattenedStyle = StyleSheet.flatten(style) || {};

  // If user passes explicit fontFamily in style, respect it
  if (flattenedStyle.fontFamily) {
    resolvedFontFamily = flattenedStyle.fontFamily;
  } else if (!weight && flattenedStyle.fontWeight) {
    // If user provided a numeric/string fontWeight in style, map it to the corresponding FontFamily
    const mapped = WEIGHT_STRING_MAP[String(flattenedStyle.fontWeight).toLowerCase()];
    if (mapped) {
      resolvedFontFamily = mapped;
    }
  }

  // Remove raw fontWeight to avoid Android font-weight synthesis glitches
  const cleanStyle = { ...flattenedStyle };
  if (cleanStyle.fontWeight) {
    delete cleanStyle.fontWeight;
  }

  // If style provides a custom fontSize without an explicit lineHeight, omit variant lineHeight
  // so React Native doesn't clamp larger text to a smaller variant lineHeight (which causes vertical text clipping).
  const hasCustomFontSize = flattenedStyle.fontSize !== undefined;
  const baseLineHeight = hasCustomFontSize ? undefined : variantStyle.lineHeight;

  return (
    <RNText
      style={[
        {
          fontSize: variantStyle.fontSize,
          ...(baseLineHeight ? { lineHeight: baseLineHeight } : {}),
          fontFamily: resolvedFontFamily,
          color: resolvedColor,
        },
        align ? { textAlign: align } : undefined,
        cleanStyle,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default AppText;
