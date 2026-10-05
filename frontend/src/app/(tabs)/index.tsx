import React from "react";
import { useRouter } from "expo-router";
import { FeedScreen } from "../../screens/feed/FeedScreen";

export default function HomeFeedTab() {
  const router = useRouter();

  return (
    <FeedScreen
      onSignOut={() => router.replace("/")}
    />
  );
}
