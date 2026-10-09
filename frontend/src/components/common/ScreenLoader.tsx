import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "./AppText";

interface ScreenLoaderProps {
  message?: string;
}

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({ message }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <AppText
          variant="metadata"
          style={[styles.message, { color: colors.textSecondary }]}
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: 12,
  },
});

export default ScreenLoader;
