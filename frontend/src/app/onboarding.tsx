import React from "react";
import { useRouter } from "expo-router";
import { OnboardingHeroScreen } from "../screens/auth/OnboardingHeroScreen";

export default function OnboardingRoute() {
  const router = useRouter();

  return (
    <OnboardingHeroScreen
      onGetStarted={() => router.push("/signup")}
      onLogIn={() => router.push("/login")}
    />
  );
}
