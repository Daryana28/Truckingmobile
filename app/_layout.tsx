import { Stack } from "expo-router";
import { LogBox, Platform } from "react-native";

export default function RootLayout() {
  LogBox.ignoreLogs(["pointerEvents is deprecated. Use style.pointerEvents"]);

  // React Native Web emits this warning from upstream libraries (e.g. navigation).
  // Hide it on web so the console stays clean.
  if (Platform.OS === "web") {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("pointerEvents is deprecated. Use style.pointerEvents")
      ) {
        return;
      }
      originalWarn(...args);
    };
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
