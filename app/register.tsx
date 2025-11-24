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
} from "react-native";
import { API_BASE } from "../src/api/index";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !phone || !password) {
      return Alert.alert("Error", "Semua field wajib diisi!");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Registrasi gagal");
      }

      Alert.alert("Berhasil", "Akun berhasil dibuat.");
      router.replace("./login");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={{
            width: 150,
            height: 150,
            alignSelf: "center",
            marginBottom: 10,
          }}
        />

        <Text
          style={{
            textAlign: "center",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 30,
          }}
        >
          Daftar Driver Baru
        </Text>

        <TextInput
          placeholder="Nama Lengkap"
          value={name}
          onChangeText={setName}
          style={{
            backgroundColor: "#FFF",
            padding: 12,
            borderRadius: 10,
            marginBottom: 15,
          }}
        />

        <TextInput
          placeholder="Nomor HP"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          style={{
            backgroundColor: "#FFF",
            padding: 12,
            borderRadius: 10,
            marginBottom: 15,
          }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            backgroundColor: "#FFF",
            padding: 12,
            borderRadius: 10,
            marginBottom: 25,
          }}
        />

        <TouchableOpacity
          style={{
            backgroundColor: loading ? "gray" : "green",
            padding: 15,
            borderRadius: 10,
          }}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            {loading ? "MENGIRIM..." : "DAFTAR"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#ef4444",
            padding: 15,
            borderRadius: 10,
            marginTop: 12,
          }}
          onPress={() => router.replace("./login")}
          disabled={loading}
        >
          <Text
            style={{ color: "#ffffff", textAlign: "center", fontWeight: "bold" }}
          >
            BATAL
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
