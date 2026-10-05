import React from "react";
import { useRouter } from "expo-router";
import { SignUpScreen } from "../screens/auth/SignUpScreen";

export default function SignUpRoute() {
  const router = useRouter();

  return (
    <SignUpScreen
      onGoogleSignUp={() => router.push("/profile-setup")}
      onAppleSignUp={() => router.push("/profile-setup")}
      onEmailSignUp={() => router.push("/email-input")}
      onLogIn={() => router.push("/login")}
      onBack={() => router.back()}
    />
  );
}
