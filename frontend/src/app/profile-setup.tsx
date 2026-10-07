import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CompleteProfileScreen } from "../screens/auth/CompleteProfileScreen";

export default function ProfileSetupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();

  const handleCompleted = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/(tabs)");
  };

  return (
    <CompleteProfileScreen
      email={params.email || ""}
      onCompleted={handleCompleted}
      onBack={() => router.back()}
    />
  );
}
