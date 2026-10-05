import React from "react";
import { useRouter } from "expo-router";
import { EmailInputScreen } from "../screens/auth/EmailInputScreen";

export default function EmailInputRoute() {
  const router = useRouter();

  return (
    <EmailInputScreen
      onContinue={(email) =>
        router.push({
          pathname: "/otp",
          params: { email },
        })
      }
      onBack={() => router.back()}
    />
  );
}
