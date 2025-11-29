// app/(tabs)/forward.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { API_BASE } from "../../src/api";
import styles from "../style/homeStyles";

export default function ForwardScreen() {
  // ============================
  // DESTINATIONS FINAL
  // ============================
  const destinations = [
    "Select Destinasi",
    "YIMM PG LOKAL PO 1",
    "YIMM PG LOKAL PO 2",
    "YIMM PG LOKAL PO 3",
  ];

  function getPlanTimes() {
    const key = destinations[destinationIndex];
    switch (key) {
      case "YIMM PG LOKAL PO 1":
        return { etd: "05:00", eta: "08:00" };
      case "YIMM PG LOKAL PO 2":
        return { etd: "08:00", eta: "13:00" };
      case "YIMM PG LOKAL PO 3":
        return { etd: "14:00", eta: "19:00" };
      default:
        return { etd: "-", eta: "-" };
    }
  }

  // ============================
  // STATE
  // ============================
  const [plateNumber, setPlateNumber] = useState("");
  const [plateStatus, setPlateStatus] = useState<"pending" | "sent">("pending");
  const [etdStatus, setEtdStatus] = useState<"pending" | "sent">("pending");
  const [etaStatus, setEtaStatus] = useState<"pending" | "sent">("pending");

  const [destinationIndex, setDestinationIndex] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userName, setUserName] = useState("");

  const FORM_KEY = "forward_form";
  const STATUS_KEY = "status_forward";

  // ============================
  // AUTO LOGIN CHECK
  // ============================
  useEffect(() => {
    async function check() {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
      if (!token || !user) router.replace("/login");
    }
    check();
  }, []);

  // ============================
  // LOAD DATA
  // ============================
  useEffect(() => {
    loadUser();
    loadStatus();
    loadForm();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setUserName(parsed?.name || "");
    } catch {}
  }

  async function loadStatus() {
    try {
      const stored = await AsyncStorage.getItem(STATUS_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      setPlateStatus(parsed?.plate || "pending");
      setEtdStatus(parsed?.etd || "pending");
      setEtaStatus(parsed?.eta || "pending");
    } catch {}
  }

  async function loadForm() {
    try {
      const stored = await AsyncStorage.getItem(FORM_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed.plateNumber) setPlateNumber(parsed.plateNumber);
      if (parsed.destinationIndex >= 0)
        setDestinationIndex(parsed.destinationIndex);
    } catch {}
  }

  // AUTO SAVE FORM
  useEffect(() => {
    AsyncStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        plateNumber,
        destinationIndex,
      })
    );
  }, [plateNumber, destinationIndex]);

  // SYNC TO REVERSE
  async function syncToReverse() {
    try {
      await AsyncStorage.setItem(
        "reverse_form",
        JSON.stringify({
          plateNumber,
          destinationIndex,
        })
      );
    } catch {}
  }

  function persistStatus(next: {
    plate?: "pending" | "sent";
    etd?: "pending" | "sent";
    eta?: "pending" | "sent";
  }) {
    AsyncStorage.setItem(
      STATUS_KEY,
      JSON.stringify({
        plate: next.plate ?? plateStatus,
        etd: next.etd ?? etdStatus,
        eta: next.eta ?? etaStatus,
      })
    );
  }

  // ============================
  // SEND API
  // ============================
  async function sendStatus(body: any) {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Belum login", "Silakan login ulang.");
        return false;
      }

      const res = await fetch(`${API_BASE}/api/status/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          direction: "forward",
          origin: "PT Indonesia Koito",
          destination:
            destinationIndex === 0 ? null : destinations[destinationIndex],
          ...body,
        }),
      });

      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }

  function now() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  // ============================
  // HANDLERS
  // ============================
  async function handlePlate() {
    if (!plateNumber.trim())
      return Alert.alert("Nopol kosong", "Isi nomor polisi terlebih dahulu");

    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    const ok = await sendStatus({
      plate: plateNumber,
    });

    if (!ok) return Alert.alert("Gagal", "Coba lagi");

    setPlateStatus("sent");
    persistStatus({ plate: "sent" });

    await syncToReverse();

    Alert.alert("Success", "Nopol terkirim");
  }

  async function handleETD() {
    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    const t = now();
    const ok = await sendStatus({
      etdTime: t,
    });

    if (!ok) return;

    setEtdStatus("sent");
    persistStatus({ etd: "sent" });

    Alert.alert("ETD dikirim", t);
  }

  async function handleETA() {
    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    const t = now();
    const ok = await sendStatus({ etaTime: t });
    if (!ok) return;

    setEtaStatus("sent");
    persistStatus({ eta: "sent" });

    Alert.alert("ETA dikirim", t);
  }

  async function logout() {
    await AsyncStorage.multiRemove(["user", "token", FORM_KEY, STATUS_KEY]);
    router.replace("/login");
  }

  // ============================
  // UI
  // ============================
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.hello}>Hello, {userName}</Text>
          <Text style={styles.subtitle}>Your deliveries for today:</Text>
        </View>

        {/* MAIN CARD */}
        <View style={styles.card}>
          {/* ICON */}
          <View style={styles.iconRow}>
            <View style={[styles.iconWrap, styles.iconWrapActive]}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={36}
                color="#e8532a"
              />
            </View>

            <Pressable
              onPress={() => router.replace("/(tabs)/reverse")}
              style={styles.iconWrap}
            >
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={36}
                color="#6b7280"
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </Pressable>
          </View>

          {/* FROM (fixed) */}
          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>PT Indonesia Koito</Text>
          </View>

          {/* NOPOL */}
          <View style={styles.row}>
            <Text style={styles.label}>Nopol</Text>
            <Text style={styles.colon}>:</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nopol"
                value={plateNumber}
                onChangeText={setPlateNumber}
                editable={etaStatus !== "sent"}
              />

              <TouchableOpacity
                disabled={plateStatus === "sent"}
                style={[
                  styles.okButton,
                  styles.buttonPending, // tetap oranye, tidak hijau
                  plateStatus === "sent" && { opacity: 0.6 },
                ]}
                onPress={handlePlate}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DESTINATION DROPDOWN */}
          <View style={styles.row}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.colon}>:</Text>

            <Pressable
              style={styles.select}
              onPress={() => etaStatus !== "sent" && setDropdownVisible(true)}
            >
              <Text style={styles.selectText}>
                {destinations[destinationIndex]}
              </Text>
              <Ionicons name="chevron-down" size={18} />
            </Pressable>
          </View>
        </View>

        {/* SECOND CARD */}
        <View style={styles.card}>
          <Text style={styles.statusValue}>
            {destinations[destinationIndex]}
          </Text>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>ETD (Plan)</Text>
            <Text style={styles.timeColon}>:</Text>
            <Text style={styles.timeValue}>{getPlanTimes().etd}</Text>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>ETA (Plan)</Text>
            <Text style={styles.timeColon}>:</Text>
            <Text style={styles.timeValue}>{getPlanTimes().eta}</Text>
          </View>

          <View className="flex-row">
            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={etdStatus === "sent"}
                style={[
                  styles.actionButton,
                  styles.buttonPending, // tetap warna pending
                  etdStatus === "sent" && { opacity: 0.6 },
                ]}
                onPress={handleETD}
              >
                <Text style={styles.actionText}>UPDATE ETD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={etaStatus === "sent"}
                style={[
                  styles.actionButton,
                  styles.buttonPending,
                  etaStatus === "sent" && { opacity: 0.6 },
                ]}
                onPress={handleETA}
              >
                <Text style={styles.actionText}>UPDATE ETA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* DESTINATION DROPDOWN */}
      <Modal transparent visible={dropdownVisible}>
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          {destinations.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.optionRow}
              onPress={() => {
                setDestinationIndex(idx);
                setDropdownVisible(false);
              }}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* LOGOUT */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomRow}>
          <View style={[styles.bottomButton, styles.bottomActive]}>
            <Ionicons name="home" size={30} color="#e8532a" />
            <Text style={styles.bottomActiveText}>Home</Text>
          </View>

          <TouchableOpacity style={styles.bottomButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={30} color="#4b5563" />
            <Text style={styles.bottomText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
