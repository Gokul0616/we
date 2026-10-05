import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { EmailOtpScreen } from "../screens/auth/EmailOtpScreen";

export default function OtpRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();

  return (
    <EmailOtpScreen
      email={params.email || ""}
      onVerified={(otp) =>
        router.push({
          pathname: "/profile-setup",
          params: { email: params.email },
        })
      }
      onBack={() => router.back()}
      onResendOtp={() => {}}
    />
  );
}
