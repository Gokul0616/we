import React from "react";
import { useRouter } from "expo-router";
import { FeedScreen } from "../../screens/feed/FeedScreen";
import { authStorage } from "../../services/authStorage";

export default function HomeFeedTab() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authStorage.clear();
    router.replace("/onboarding");
  };

  return <FeedScreen onSignOut={handleSignOut} />;
}
