import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { StatusBar } from "expo-status-bar";
import { GlobalToast } from "../components/GlobalToast";
import { CustomAlert } from "../components/CustomAlert";
import { apiClient } from "../services/apiClient";
import { authStorage } from "../services/authStorage";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === "android" ? "default" : "slide_from_right",
          animationDuration: Platform.OS === "android" ? 200 : undefined,
        }}
      >
        {/* Splash: no swipe back */}
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />

        {/* Onboarding: no swipe back to splash */}
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />

        {/* Main Authenticated App Tabs: STRICTLY DISABLE gesture so left-to-right swipe cannot go back to auth screens */}
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
            animation: "fade",
          }}
        />

        {/* Auth Sub-screens: allow gesture back to previous auth screen */}
        <Stack.Screen name="login" options={{ gestureEnabled: true }} />
        <Stack.Screen name="signup" options={{ gestureEnabled: true }} />
        <Stack.Screen name="email-input" options={{ gestureEnabled: true }} />
        <Stack.Screen name="otp" options={{ gestureEnabled: true }} />
        <Stack.Screen name="profile-setup" options={{ gestureEnabled: true }} />

        {/* App Modals & Detail screens */}
        <Stack.Screen
          name="chat/[id]"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="post/[id]"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            animation: Platform.OS === "android" ? "fade_from_bottom" : "slide_from_bottom",
            animationDuration: Platform.OS === "android" ? 180 : undefined,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="create-post"
          options={{
            presentation: "fullScreenModal",
            animation: Platform.OS === "android" ? "fade_from_bottom" : "slide_from_bottom",
            animationDuration: Platform.OS === "android" ? 220 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/index"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/photo"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/cover"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/bio"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/location"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/website"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/social"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/privacy"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/visibility"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/tagging"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
        <Stack.Screen
          name="edit-profile/preview"
          options={{
            animation: Platform.OS === "android" ? "default" : "slide_from_right",
            animationDuration: Platform.OS === "android" ? 200 : undefined,
          }}
        />
      </Stack>
      <GlobalToast />
      <CustomAlert />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    apiClient.setOnUnauthorized(async () => {
      await authStorage.clear();
      router.replace("/onboarding");
    });
  }, [router]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
