import React from "react";
import { useRouter } from "expo-router";
import { SplashScreen } from "../screens/auth/SplashScreen";

export default function IndexRoute() {
  const router = useRouter();

  return (
    <SplashScreen
      onNext={() => router.push("/onboarding")}
    />
  );
}
