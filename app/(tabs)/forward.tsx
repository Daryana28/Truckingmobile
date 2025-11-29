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
  const destinations = [
    "Select Destinasi",
    "Yamaha PG Lokal PO 1",
    "Yamaha PG Lokal PO 2",
    "Yamaha PG Lokal PO 3",
    "Yamaha PG export cycle 1",
    "Yamaha PG export cycle 2",
    "Yamaha Karawang PO 1",
    "Yamaha Karawang PO 2",
    "Yamaha Karawang PO 3",
  ];

  // STATE
  const [plateNumber, setPlateNumber] = useState("");
  const [plateStatus, setPlateStatus] = useState<"pending" | "sent">("pending");
  const [etdStatus, setEtdStatus] = useState<"pending" | "sent">("pending");
  const [etaStatus, setEtaStatus] = useState<"pending" | "sent">("pending");

  const [destinationIndex, setDestinationIndex] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userName, setUserName] = useState("");

  // STORAGE KEYS
  const FORM_KEY = "forward_form";
  const STATUS_KEY = "status_forward";
  const STATUS_KEY_REVERSE = "status_reverse";

  // ============================
  // AUTO LOGIN CHECK
  // ============================
  useEffect(() => {
    let mounted = true;

    async function ensureLoggedIn() {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");

      if (!mounted) return;

      if (!token || !user) router.replace("/login");
    }

    ensureLoggedIn();
    return () => {
      mounted = false;
    };
  }, []);

  // ============================
  // LOAD SAVED DATA
  // ============================
  useEffect(() => {
    loadUser();
    loadStatus();
    loadFormData();
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

  async function loadFormData() {
    try {
      const stored = await AsyncStorage.getItem(FORM_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);

      if (parsed?.plateNumber) setPlateNumber(parsed.plateNumber);
      if (parsed?.destinationIndex >= 0)
        setDestinationIndex(parsed.destinationIndex);
    } catch {}
  }

  // AUTO-SAVE plate + destination
  useEffect(() => {
    AsyncStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        plateNumber,
        destinationIndex,
      })
    );
  }, [plateNumber, destinationIndex]);

  function persistStatus(next: {
    plate?: "pending" | "sent";
    etd?: "pending" | "sent";
    eta?: "pending" | "sent";
  }) {
    const combined = {
      plate: next.plate ?? plateStatus,
      etd: next.etd ?? etdStatus,
      eta: next.eta ?? etaStatus,
    };
    AsyncStorage.setItem(STATUS_KEY, JSON.stringify(combined));
  }

  // ============================
  // SEND STATUS TO API
  // ============================
  async function sendStatus(payload: any) {
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
          ...payload,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Status ${res.status}: ${msg}`);
      }

      return true;
    } catch (e) {
      Alert.alert("Gagal kirim status", e instanceof Error ? e.message : "");
      return false;
    }
  }

  function getNowTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  }

  function getPlanTimes() {
    const key = destinations[destinationIndex];
    switch (key) {
      case "Yamaha PG Lokal PO 1":
      case "Yamaha PG export cycle 1":
      case "Yamaha Karawang PO 1":
        return { etd: "05:00", eta: "08:00" };
      case "Yamaha PG Lokal PO 2":
      case "Yamaha Karawang PO 2":
        return { etd: "08:00", eta: "13:00" };
      case "Yamaha PG Lokal PO 3":
      case "Yamaha PG export cycle 2":
      case "Yamaha Karawang PO 3":
        return { etd: "14:00", eta: "19:00" };
      default:
        return { etd: "-", eta: "-" };
    }
  }

  // ============================
  // ACTION HANDLERS
  // ============================
  async function handlePlateSubmit() {
    if (!plateNumber.trim())
      return Alert.alert("Nopol kosong", "Isi nomor polisi");

    const ok = await sendStatus({
      plate: plateNumber,
      destination: destinations[destinationIndex],
    });

    if (!ok) return;

    setPlateStatus("sent");
    persistStatus({ plate: "sent" });
    Alert.alert("Nopol Terkirim");
  }

  async function handleUpdateEtd() {
    const time = getNowTime();

    const ok = await sendStatus({
      etdTime: time,
      destination: destinations[destinationIndex],
    });

    if (!ok) return;

    setEtdStatus("sent");
    persistStatus({ etd: "sent" });
    Alert.alert("ETD dikirim", time);
  }

  async function handleUpdateEta() {
    const time = getNowTime();

    const ok = await sendStatus({
      etaTime: time,
      destination: destinations[destinationIndex],
    });

    if (!ok) return;

    setEtaStatus("sent");
    persistStatus({ eta: "sent" });
    Alert.alert("ETA dikirim", time);
  }

  // ============================
  // LOGOUT (tidak reset data)
  // ============================
  async function handleLogout() {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");

    // ⚠ Data ETD/ETA/Nopol/Status TIDAK DIHAPUS

    router.replace("/login");
  }

  // ============================
  // UI RENDER
  // ============================
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.hello}>{`Hello, ${userName}`}</Text>
          <Text style={styles.subtitle}>Your deliveries for today:</Text>
        </View>

        {/* MAIN CARD */}
        <View style={styles.card}>
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

          {/* FROM */}
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
                placeholder="Masukkan nomor polisi"
                placeholderTextColor="#94a3b8"
                value={plateNumber}
                onChangeText={setPlateNumber}
              />

              <TouchableOpacity
                disabled={plateStatus === "sent"}
                style={[
                  styles.okButton,
                  plateStatus === "sent"
                    ? styles.buttonSent
                    : styles.buttonPending,
                ]}
                onPress={handlePlateSubmit}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DESTINATION */}
          <View style={styles.row}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.colon}>:</Text>

            <Pressable
              style={styles.select}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={styles.selectText}>
                {destinations[destinationIndex]}
              </Text>
              <Ionicons name="chevron-down" size={18} />
            </Pressable>
          </View>
        </View>

        {/* CARD 2 */}
        <View style={styles.card}>
          <Text style={styles.statusValue}>
            {destinationIndex === 0
              ? "No data"
              : destinations[destinationIndex]}
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

          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={etdStatus === "sent"}
              style={[
                styles.actionButton,
                etdStatus === "sent" ? styles.buttonSent : styles.buttonPending,
              ]}
              onPress={handleUpdateEtd}
            >
              <Text style={styles.actionText}>UPDATE ETD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={etaStatus === "sent"}
              style={[
                styles.actionButton,
                etaStatus === "sent" ? styles.buttonSent : styles.buttonPending,
              ]}
              onPress={handleUpdateEta}
            >
              <Text style={styles.actionText}>UPDATE ETA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* DESTINATION DROPDOWN */}
      <Modal transparent visible={dropdownVisible} animationType="fade">
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

      {/* BOTTOM NAV */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomRow}>
          <View style={[styles.bottomButton, styles.bottomActive]}>
            <Ionicons name="home" size={30} color="#e8532a" />
            <Text style={styles.bottomActiveText}>Home</Text>
          </View>

          <TouchableOpacity style={styles.bottomButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={30} color="#4b5563" />
            <Text style={styles.bottomText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
