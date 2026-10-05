import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";

interface SplashScreenProps {
  onNext?: () => void;
}

export function SplashScreen({ onNext }: SplashScreenProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const imageScale = useRef(new Animated.Value(1.06)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 3.2 seconds if not tapped
    const timer = setTimeout(() => {
      onNext?.();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Soft Ambient Background Elements */}
      <View style={styles.ambientBackground} pointerEvents="none">
        <View style={[styles.ambientOrb, styles.orbTopRight]} />
        <View style={[styles.ambientOrb, styles.orbMiddleLeft]} />
      </View>

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Brand Header Section matching Screen 01 design */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>WE</Text>
          <Text style={styles.brandTagline}>Connect. Share. Belong.</Text>
          <Text style={styles.description}>
            A next-generation social network for authentic conversations, visual content,
            private communities, direct messaging, discovery and real-time social
            interactions.
          </Text>
        </Animated.View>

        {/* Mountain Landscape Photography Section */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
          <Image
            source={require("../../../assets/images/splash_mountain.jpg")}
            style={styles.mountainImage}
            resizeMode="cover"
          />

          {/* Smooth organic gradient blend with top white background */}
          <LinearGradient
            colors={[
              "#FFFFFF",
              "rgba(255, 255, 255, 0.9)",
              "rgba(255, 255, 255, 0.4)",
              "transparent",
            ]}
            locations={[0, 0.25, 0.65, 1]}
            style={styles.topGradientFade}
          />

          {/* Subtle bottom gradient vignette */}
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.45)"]}
            style={styles.bottomGradientVignette}
          />

          {/* Floating Tap to Continue Indicator */}
          <SafeAreaView edges={["bottom"]} style={styles.bottomCtaContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.85}
              onPress={onNext}
            >
              <Text style={styles.continueButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </SafeAreaView>

      {/* Screen-wide tap fallback */}
      <TouchableOpacity
        style={styles.touchableBackdrop}
        activeOpacity={1}
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
    justifyContent: "space-between",
  },
  ambientBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    overflow: "hidden",
  },
  ambientOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTopRight: {
    top: -60,
    right: -50,
    width: 260,
    height: 260,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
  },
  orbMiddleLeft: {
    top: 140,
    left: -80,
    width: 220,
    height: 220,
    backgroundColor: "rgba(99, 102, 241, 0.04)",
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  brandTitle: {
    fontSize: 58,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -2.5,
    lineHeight: 64,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#64748B",
    fontWeight: "400",
    maxWidth: 310,
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    marginTop: 10,
    overflow: "hidden",
  },
  mountainImage: {
    width: "100%",
    height: "100%",
  },
  topGradientFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  bottomGradientVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomCtaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: "center",
    zIndex: 10,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  touchableBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    zIndex: 3,
  },
});

