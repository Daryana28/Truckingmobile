import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Disable slide animation when switching between forward/reverse.
        animation: "none",
      }}
    >
      <Stack.Screen name="forward" />
      <Stack.Screen name="reverse" />
    </Stack>
  );
}
