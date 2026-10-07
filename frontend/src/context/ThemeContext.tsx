import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, ThemeColors, ThemeMode } from "../constants/theme";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "@we_social_theme_mode";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "system",
  isDark: false,
  colors: LightColors,
  setThemeMode: async () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme(); // "light" | "dark" | null | undefined
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeModeState(saved as ThemeMode);
      }
      setIsLoaded(true);
    }).catch(() => {
      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Failed saving theme mode to storage:", e);
    }
  };

  const activeTheme: "light" | "dark" = useMemo(() => {
    if (themeMode === "light") return "light";
    if (themeMode === "dark") return "dark";
    return systemColorScheme === "dark" ? "dark" : "light";
  }, [themeMode, systemColorScheme]);

  const toggleTheme = () => {
    const nextMode: ThemeMode = activeTheme === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
  };

  const colors: ThemeColors = useMemo(() => {
    return activeTheme === "dark" ? DarkColors : LightColors;
  }, [activeTheme]);

  const value = useMemo(
    () => ({
      theme: activeTheme,
      themeMode,
      isDark: activeTheme === "dark",
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [activeTheme, themeMode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
