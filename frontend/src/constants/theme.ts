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
  background: "#090D16",
  secondaryBg: "#0F172A",
  surface: "#1E293B",
  surfaceHighlight: "#334155",
  card: "#131B2E",
  border: "#1E293B",
  borderLight: "#26334D",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.65)",
  overlayDark: "rgba(0, 0, 0, 0.85)",
};

export const Colors = LightColors;

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
};

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
