import React from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeLogo } from "../../components/WeLogo";
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from "react-native-svg";

interface OnboardingMinimalScreenProps {
  onNext?: () => void;
}

export function OnboardingMinimalScreen({ onNext }: OnboardingMinimalScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Fluid Organic Gradient Background Blobs matching design */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 400 800">
          <Defs>
            <RadialGradient id="blob1" cx="30%" cy="20%" r="50%">
              <Stop offset="0%" stopColor="#E0EDFF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="blob2" cx="80%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#EFF6FF" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="blob3" cx="20%" cy="80%" r="50%">
              <Stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="120" cy="160" r="160" fill="url(#blob1)" />
          <Circle cx="320" cy="320" r="200" fill="url(#blob2)" />
          <Circle cx="80" cy="640" r="180" fill="url(#blob3)" />
        </Svg>
      </View>

      {/* Centered Brand Presence */}
      <View style={styles.centerContent}>
        <WeLogo size="xl" showTagline={true} color="#1E293B" taglineColor="#475569" />
      </View>

      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={0.9}
        onPress={onNext}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  touchArea: {
    ...StyleSheet.absoluteFill,
  },
});
