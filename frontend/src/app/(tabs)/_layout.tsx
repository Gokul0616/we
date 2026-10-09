import React from "react";
import { StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily } from "../../constants/theme";

export default function TabLayout() {
  const { colors, isDark, iosTabStyle } = useTheme();
  const insets = useSafeAreaInsets();

  // On iOS, if user selected Native Tabs, render Apple's native UITabBar
  if (Platform.OS === "ios" && iosTabStyle === "native") {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="safari.fill" md="explore" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="messages" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="chat" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Otherwise (iOS custom solid tabs or Android/Web): render solid OLED black / light tabs
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 14 : 8);
  const tabHeight = 52 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? "#000000" : colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? "#1F1F1F" : colors.border,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontFamily.semiBold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
