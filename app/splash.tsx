import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { Dimensions, Image, View } from "react-native";

export default function Splash() {
  const { width } = Dimensions.get("window");

  useEffect(() => {
    async function run() {
      const user = await AsyncStorage.getItem("user");

      setTimeout(() => {
        if (user) {
          router.replace("/(tabs)/forward");
        } else {
          router.replace("/login");
        }
      }, 2000);
    }

    run();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../assets/images/splash.png")}
        style={{
          width: width * 0.7,
          height: width * 0.7,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
