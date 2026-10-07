import React from "react";
import { useRouter } from "expo-router";
import { LoginScreen } from "../screens/auth/LoginScreen";

export default function LoginRoute() {
  const router = useRouter();

  const handleSuccess = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/(tabs)");
  };

  return (
    <LoginScreen
      onSuccess={handleSuccess}
      onGoToSignUp={() => router.push("/signup")}
      onBack={() => router.back()}
    />
  );
}
