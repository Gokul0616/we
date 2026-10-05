export const Colors = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#FFFFFF",
  secondaryBg: "#F7F7F5",
  surface: "#F8FAFC",
  card: "#FFFFFF",
  border: "#EAEAEA",
  borderLight: "#F1F5F9",
  textPrimary: "#171717",
  textSecondary: "#737373",
  textMuted: "#94A3B8",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.45)",
  overlayDark: "rgba(0, 0, 0, 0.75)",
};

export const Typography = {
  largeTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as const,
    color: Colors.textPrimary,
  },
  metadata: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  caption: {
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
