import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { authStorage } from "../services/authStorage";

export default function IndexRoute() {
  const router = useRouter();
  const [, setCheckingAuth] = useState(true);
  const isAuthenticatedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const token = await authStorage.getToken();
        if (token && isMounted) {
          isAuthenticatedRef.current = true;
          // Smoothly route to main tabs when session exists
          setTimeout(() => {
            if (isMounted) {
              router.replace("/(tabs)");
            }
          }, 700);
          return;
        }
      } catch (err) {
        console.log("⚠️ [IndexRoute] Auth session check failed:", err);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleNext = () => {
    if (isAuthenticatedRef.current) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  };

  return <SplashScreen onNext={handleNext} />;
}
