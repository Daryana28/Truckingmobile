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
  StyleSheet,
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
    router.replace("/splash");
  }

  async function handleLogin() {
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
      if (!json.success) return Alert.alert("Login gagal", json.message);

      await AsyncStorage.setItem("token", json.token);
      await AsyncStorage.setItem("user", JSON.stringify(json.driver));

      setPendingUser(json.driver);
      setLocationPrompt(true);
    } catch {
      Alert.alert("Error", "Server tidak dapat dihubungi");
    }
  }

  return (
    <View style={styles.screenWrapper}>
      {/* ⭐ Tetap center sebelum keyboard muncul */}
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {/* HERO - tidak bergerak saat keyboard muncul */}
        <View style={styles.heroWrapper}>
          <Image
            source={require("../assets/images/hero.png")}
            style={styles.hero}
            resizeMode="contain"
          />
        </View>

        {/* FORM - hanya bagian ini yang naik */}
        <View style={styles.formWrapper}>
          <Text style={styles.title}>
            Welcome to{" "}
            <Text style={{ color: "#e8532a", fontWeight: "bold" }}>TRAMO!</Text>
          </Text>

          <Text style={styles.subtitle}>
            Your go-to app for real-time trucking and logistics tracking.
          </Text>

          <TextInput
            placeholder="Nama Lengkap"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By logging in, you agree to our{" "}
            <Text style={styles.link}>Terms of service</Text> and{" "}
            <Text style={styles.link}>Privacy policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Izin Lokasi */}
      {locationPrompt && (
        <View style={styles.modalWrapper}>
          <View style={styles.modal}>
            <Image
              source={{
                uri: "https://img.icons8.com/?size=100&id=13800&format=png&color=e8532a",
              }}
              style={{
                width: 50,
                height: 50,
                alignSelf: "center",
                marginBottom: 10,
              }}
              resizeMode="contain"
            />

            <Text style={styles.modalTitle}>Aktifkan Lokasi</Text>

            <Text style={styles.modalDesc}>
              Aplikasi membutuhkan izin lokasi untuk melanjutkan ke dashboard.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={async () => {
                if (pendingUser) {
                  await requestLocationAndContinue(pendingUser);
                  setLocationPrompt(false);
                }
              }}
            >
              <Text style={styles.modalBtnText}>Izinkan & Lanjutkan</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLocationPrompt(false)}>
              <Text
                style={{ color: "#e8532a", textAlign: "center", marginTop: 10 }}
              >
                Batal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "white",
  },

  // ⭐ seluruh halaman tetap center sebelum keyboard muncul
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  heroWrapper: {
    width: "100%",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },

  hero: {
    width: "100%",
    height: "100%",
  },

  formWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#555",
    marginTop: 6,
    fontSize: 14,
    width: "85%",
  },

  input: {
    backgroundColor: "#F5F5F5",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },

  loginBtn: {
    backgroundColor: "#e8532a",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
  },

  loginText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  terms: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
    color: "#666",
    width: "85%",
  },

  link: {
    color: "#e8532a",
    fontWeight: "600",
  },

  modalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },

  modalDesc: {
    textAlign: "center",
    color: "#555",
    marginTop: 8,
  },

  modalBtn: {
    backgroundColor: "#e8532a",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },

  modalBtnText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
