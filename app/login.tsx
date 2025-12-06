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
import Svg, { Path } from "react-native-svg"; // SVG Eye Icon
import { API_BASE } from "../src/api/index";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // SVG Eye icon
  const EyeIcon = ({ open = false }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {open ? (
        <>
          <Path
            d="M17.94 17.94L6.06 6.06"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M10.58 10.58A3 3 0 0113.42 13.42"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M6.7 6.7C3.9 8.3 2 12 2 12s3 7 10 7c2.1 0 3.9-.6 5.4-1.5"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M12 5c3.9 0 7.3 2.1 9 4.5"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7z"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );

  return (
    <View style={styles.screenWrapper}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          <Image
            source={require("../assets/images/hero.png")}
            style={styles.hero}
            resizeMode="contain"
          />
        </View>

        {/* FORM */}
        <View style={styles.formWrapper}>
          <Text style={styles.title}>
            Welcome to{" "}
            <Text style={{ color: "#e8532a", fontWeight: "bold" }}>TRAMO!</Text>
          </Text>

          <Text style={styles.subtitle}>
            Your go-to app for real-time trucking and logistics tracking.
          </Text>

          {/* NAMA */}
          <TextInput
            placeholder="Nama Lengkap"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {/* PASSWORD */}
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { paddingRight: 50 }]}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <EyeIcon open={showPassword} />
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>

          {/* TERMS */}
          <Text style={styles.terms}>
            By logging in, you agree to our{" "}
            <Text style={styles.link}>Terms of service</Text> and{" "}
            <Text style={styles.link}>Privacy policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* MODAL IZIN LOKASI */}
      {locationPrompt && (
        <View style={styles.modalWrapper}>
          <View style={styles.modal}>
            <Image
              source={{
                uri: "https://img.icons8.com/?size=100&id=13800&format=png&color=e8532a",
              }}
              style={styles.modalIcon}
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

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setLocationPrompt(false)}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

/* ============================= */
/*            STYLES             */
/* ============================= */

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: "white" },

  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  heroWrapper: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },

  hero: { width: "100%", height: "100%" },

  formWrapper: { width: "100%", alignItems: "center", marginTop: 10 },

  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },

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

  passwordWrapper: {
    width: "100%",
    marginTop: 10,
    position: "relative",
  },

  eyeButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
    padding: 4,
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

  link: { color: "#e8532a", fontWeight: "600" },

  /* ===== MODAL ===== */

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

  modalIcon: {
    width: 50,
    height: 50,
    alignSelf: "center",
    marginBottom: 12,
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
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 22,
    marginBottom: 14, 
  },

  modalBtnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  cancelBtn: {
    paddingVertical: 10,
    alignSelf: "center",
  },

  cancelBtnText: {
    color: "#e8532a",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 15,
  },
});
