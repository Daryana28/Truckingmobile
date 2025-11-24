import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Index() {
  useEffect(() => {
    let mounted = true;

    async function checkLogin() {
      try {
        const user = await AsyncStorage.getItem("user");

        if (!mounted) return;

        if (user) {
          router.replace("/(tabs)/forward");
        } else {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      }
    }

    checkLogin();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
