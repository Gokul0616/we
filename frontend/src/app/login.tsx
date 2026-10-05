import React from "react";
import { useRouter } from "expo-router";
import { LoginScreen } from "../screens/auth/LoginScreen";

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onSuccess={() => router.replace("/(tabs)")}
      onGoToSignUp={() => router.push("/signup")}
      onBack={() => router.back()}
    />
  );
}
