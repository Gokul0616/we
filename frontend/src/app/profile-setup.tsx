import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CompleteProfileScreen } from "../screens/auth/CompleteProfileScreen";

export default function ProfileSetupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();

  return (
    <CompleteProfileScreen
      email={params.email || ""}
      onCompleted={() => router.replace("/(tabs)")}
      onBack={() => router.back()}
    />
  );
}
