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
    avatar?: string;
  }>();

  return (
    <OtherProfileScreen
      username={params.username || ""}
      name={params.name}
      avatar={params.avatar}
      location={params.location}
      bio={params.bio}
      onBack={() => router.back()}
      onMessage={() => router.push({ pathname: "/(tabs)/messages", params: { recipient: params.username } } as any)}
    />
  );
}
