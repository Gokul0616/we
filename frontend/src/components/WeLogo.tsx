import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, FontFamily } from "../constants/theme";
import { AppText } from "./common/AppText";

interface WeLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  color?: string;
  taglineColor?: string;
}

export function WeLogo({
  size = "md",
  showTagline = false,
  color = "#1E293B",
  taglineColor = "#334155",
}: WeLogoProps) {
  const sizeMap = {
    sm: { fontSize: 26, lineHeight: 32, letterSpacing: -1, taglineSize: 10, marginTop: 2 },
    md: { fontSize: 38, lineHeight: 46, letterSpacing: -1.5, taglineSize: 13, marginTop: 4 },
    lg: { fontSize: 52, lineHeight: 62, letterSpacing: -2, taglineSize: 15, marginTop: 6 },
    xl: { fontSize: 72, lineHeight: 84, letterSpacing: -3, taglineSize: 18, marginTop: 8 },
  };

  const current = sizeMap[size];

  return (
    <View style={styles.container}>
      <AppText
        weight="extrabold"
        style={[
          styles.logoText,
          {
            fontSize: current.fontSize,
            lineHeight: current.lineHeight,
            letterSpacing: current.letterSpacing,
            color,
          },
        ]}
      >
        WE
      </AppText>
      {showTagline && (
        <AppText
          weight="semibold"
          style={[
            styles.tagline,
            {
              fontSize: current.taglineSize,
              marginTop: current.marginTop,
              color: taglineColor,
            },
          ]}
        >
          Connect. Share. Belong.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: FontFamily.extraBold,
  },
  tagline: {
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.5,
  },
});
