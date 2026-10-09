import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useColorScheme, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, ThemeColors, ThemeMode } from "../constants/theme";
import { authStorage } from "../services/authStorage";
import { userService } from "../services/userService";

export type IosTabStyle = "native" | "custom";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => void;
  iosTabStyle: IosTabStyle;
  setIosTabStyle: (style: IosTabStyle) => Promise<void>;
}

const THEME_STORAGE_KEY = "@we_social_theme_mode";
const IOS_TAB_STYLE_STORAGE_KEY = "@we_social_ios_tab_style";

const defaultIosTabStyle: IosTabStyle = Platform.OS === "ios" ? "native" : "custom";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "system",
  isDark: false,
  colors: LightColors,
  setThemeMode: async () => { },
  toggleTheme: () => { },
  iosTabStyle: defaultIosTabStyle,
  setIosTabStyle: async () => { },
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme(); // "light" | "dark" | null | undefined
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [iosTabStyle, setIosTabStyleState] = useState<IosTabStyle>(defaultIosTabStyle);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Load theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeModeState(saved as ThemeMode);
      }
      setIsLoaded(true);
    }).catch(() => {
      setIsLoaded(true);
    });

    // 2. Load iOS tab style preference from local cache
    AsyncStorage.getItem(IOS_TAB_STYLE_STORAGE_KEY).then((saved) => {
      if (saved === "native" || saved === "custom") {
        setIosTabStyleState(saved as IosTabStyle);
      } else if (Platform.OS === "ios") {
        setIosTabStyleState("native");
      }
    }).catch(() => { });

    // 3. Sync iOS tab style preference from backend user profile
    authStorage.getUser().then((user) => {
      const backendStyle = user?.content_preferences?.ios_tab_style;
      if (backendStyle === "native" || backendStyle === "custom") {
        setIosTabStyleState(backendStyle);
        AsyncStorage.setItem(IOS_TAB_STYLE_STORAGE_KEY, backendStyle).catch(() => { });
      } else if (Platform.OS === "ios") {
        setIosTabStyleState("native");
      }
    }).catch(() => { });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.log("Failed saving theme mode to storage:", e);
    }
  };

  const setIosTabStyle = async (style: IosTabStyle) => {
    setIosTabStyleState(style);
    try {
      await AsyncStorage.setItem(IOS_TAB_STYLE_STORAGE_KEY, style);
      // Persist to backend
      await userService.updateContentPreferences({ ios_tab_style: style });
    } catch (e) {
      console.log("Failed saving iOS tab style preference:", e);
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
      iosTabStyle,
      setIosTabStyle,
    }),
    [activeTheme, themeMode, colors, iosTabStyle]
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
