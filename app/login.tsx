// app/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE } from "../src/api/index";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  async function requestLocationAndContinue(userData: any) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert(
        "Izin Lokasi",
        "Aktifkan izin lokasi untuk melanjutkan."
      );
    }

    await AsyncStorage.setItem("user", JSON.stringify(userData));
    router.replace("/(tabs)/forward");
  }

  async function handleLogin() {
    console.log("Login button pressed");

    if (!name || !password) {
      return Alert.alert("Error", "Nama dan password wajib diisi");
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      const json = await res.json();
      console.log("LOGIN RESPONSE:", json);

      if (!json.success) {
        return Alert.alert("Login gagal", json.message);
      }

      await AsyncStorage.setItem("token", json.token);
      await AsyncStorage.setItem("user", JSON.stringify(json.driver));

      setPendingUser(json.driver);
      setLocationPrompt(true);
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("Error", "Server tidak dapat dihubungi");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View style={{ padding: 20 }}>
          <Image
            source={require("../assets/images/logo.png")}
            style={{
              width: 150,
              height: 150,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <Text
            style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}
          >
            PT INDONESIA KOITO
          </Text>

          {/* NAME */}
          <TextInput
            placeholder="Nama Lengkap"
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: "#FFF",
              padding: 12,
              marginTop: 30,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          />

          {/* PASSWORD */}
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              backgroundColor: "#FFF",
              padding: 12,
              marginTop: 20,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          />

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={{
              backgroundColor: "green",
              padding: 15,
              borderRadius: 10,
              marginTop: 30,
            }}
            onPress={handleLogin}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              LOGIN
            </Text>
          </TouchableOpacity>

          {/* REGISTER */}
          <TouchableOpacity
            style={{
              backgroundColor: "red",
              padding: 15,
              borderRadius: 10,
              marginTop: 10,
            }}
            onPress={() => router.push("./register")}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              DAFTAR
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===================== */}
      {/*  MODAL IZIN LOKASI   */}
      {/* ===================== */}
      {locationPrompt && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              width: "100%",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 40, textAlign: "center" }}>📍</Text>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Aktifkan Lokasi
            </Text>

            <Text
              style={{
                textAlign: "center",
                color: "#555",
                marginTop: 8,
              }}
            >
              Aplikasi membutuhkan izin lokasi untuk melanjutkan ke dashboard.
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#2563eb",
                paddingVertical: 12,
                borderRadius: 10,
                marginTop: 20,
              }}
              onPress={async () => {
                if (pendingUser) {
                  await requestLocationAndContinue(pendingUser);
                  setLocationPrompt(false);
                }
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Izinkan & Lanjutkan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12 }}
              onPress={() => setLocationPrompt(false)}
            >
              <Text
                style={{ color: "#ef4444", textAlign: "center", marginTop: 10 }}
              >
                Batal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
