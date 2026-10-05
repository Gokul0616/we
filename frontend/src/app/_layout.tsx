import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GlobalToast } from "../components/GlobalToast";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <GlobalToast />
    </SafeAreaProvider>
  );
}
