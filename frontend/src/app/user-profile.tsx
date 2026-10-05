import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { OtherProfileScreen } from "../screens/profile/OtherProfileScreen";

export default function UserProfileRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    username?: string;
    name?: string;
    location?: string;
    bio?: string;
  }>();

  return (
    <OtherProfileScreen
      username={params.username || "alex_wanderer"}
      name={params.name || "Alex Wanderer"}
      location={params.location || "Bali, Indonesia"}
      bio={params.bio}
      onBack={() => router.back()}
      onMessage={() => router.push("/(tabs)/messages")}
    />
  );
}
