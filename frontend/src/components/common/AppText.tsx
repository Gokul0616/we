import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { FontFamily, Colors } from "../../constants/theme";

export interface AppTextProps extends TextProps {
  weight?: "regular" | "medium" | "semibold" | "bold" | "extrabold";
}

export function AppText({ weight = "regular", style, ...props }: AppTextProps) {
  const getFontFamily = () => {
    switch (weight) {
      case "extrabold":
        return FontFamily.extraBold;
      case "bold":
        return FontFamily.bold;
      case "semibold":
        return FontFamily.semiBold;
      case "medium":
        return FontFamily.medium;
      case "regular":
      default:
        return FontFamily.regular;
    }
  };

  return (
    <RNText
      style={[
        {
          fontFamily: getFontFamily(),
          color: Colors.textPrimary,
        },
        style,
      ]}
      {...props}
    />
  );
}
