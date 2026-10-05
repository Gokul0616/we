import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

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
    sm: { fontSize: 26, letterSpacing: -1, taglineSize: 10, marginTop: 2 },
    md: { fontSize: 38, letterSpacing: -1.5, taglineSize: 13, marginTop: 4 },
    lg: { fontSize: 52, letterSpacing: -2, taglineSize: 15, marginTop: 6 },
    xl: { fontSize: 72, letterSpacing: -3, taglineSize: 18, marginTop: 8 },
  };

  const current = sizeMap[size];

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.logoText,
          {
            fontSize: current.fontSize,
            letterSpacing: current.letterSpacing,
            color,
          },
        ]}
      >
        WE
      </Text>
      {showTagline && (
        <Text
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
        </Text>
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
    fontWeight: "900",
    fontFamily: "System",
  },
  tagline: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
