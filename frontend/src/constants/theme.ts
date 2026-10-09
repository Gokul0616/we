export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  secondaryBg: string;
  surface: string;
  surfaceHighlight: string;
  card: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  white: string;
  black: string;
  overlay: string;
  overlayDark: string;
}

export const LightColors: ThemeColors = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#FFFFFF",
  secondaryBg: "#F7F7F5",
  surface: "#F8FAFC",
  surfaceHighlight: "#F1F5F9",
  card: "#FFFFFF",
  border: "#EAEAEA",
  borderLight: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.45)",
  overlayDark: "rgba(0, 0, 0, 0.75)",
};

export const DarkColors: ThemeColors = {
  primary: "#3B82F6",
  primaryHover: "#60A5FA",
  secondary: "#A78BFA",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#F87171",
  background: "#000000",
  secondaryBg: "#000000",
  surface: "#121212",
  surfaceHighlight: "#1E1E1E",
  card: "#000000",
  border: "#1F1F1F",
  borderLight: "#262626",
  textPrimary: "#F8FAFC",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.75)",
  overlayDark: "rgba(0, 0, 0, 0.90)",
};

export const Colors = LightColors;

/**
 * Returns `color` (a `#RRGGBB` theme token) with the supplied alpha channel.
 * Lets screens tint with `colors.primary` / `colors.danger` etc. and stay
 * correct in both light and dark themes instead of hardcoding rgba values.
 */
export function withAlpha(color: string, opacity: number): string {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = Math.max(0, Math.min(1, opacity));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const FontFamily = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
};

export const Typography = {
  largeTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800" as const,
    color: Colors.textPrimary,
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  subheading: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    color: Colors.textPrimary,
  },
  metadata: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  button: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  link: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  h1: {
    fontFamily: FontFamily.extraBold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800" as const,
    color: Colors.textPrimary,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
};

export type TypographyVariant = keyof typeof Typography;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const ButtonStyles = {
  height: {
    sm: 36,
    md: 48,
    lg: 54,
  },
  radius: {
    sm: Radius.sm,
    md: Radius.md,
    lg: Radius.xl,
    pill: Radius.pill,
  },
  typography: {
    sm: {
      fontFamily: FontFamily.semiBold,
      fontSize: 13,
      lineHeight: 18,
    },
    md: {
      fontFamily: FontFamily.semiBold,
      fontSize: 15,
      lineHeight: 20,
    },
    lg: {
      fontFamily: FontFamily.bold,
      fontSize: 16,
      lineHeight: 22,
    },
  },
};

export const InputStyles = {
  height: {
    sm: 42,
    md: 48,
    lg: 54,
  },
  radius: Radius.md,
  typography: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  labelTypography: {
    fontSize: 13.5,
    fontFamily: FontFamily.semiBold,
  },
  helperTypography: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
};

