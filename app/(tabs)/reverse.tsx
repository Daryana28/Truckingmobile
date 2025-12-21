import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE } from "../../src/api";
import styles from "../style/homeStyles";

export default function ReverseScreen() {
  const destinations = [
    "Select Destinasi",
    "YIMM PG LOKAL PO 1",
    "YIMM PG LOKAL PO 2",
    "YIMM PG LOKAL PO 3",
  ];

  const [plateNumber, setPlateNumber] = useState("");
  const [etdStatus, setEtdStatus] = useState<"pending" | "sent">("pending");
  const [etaStatus, setEtaStatus] = useState<"pending" | "sent">("pending");
  const [destinationIndex, setDestinationIndex] = useState(0);
  const [userName, setUserName] = useState("");

  const FORM_KEY = "reverse_form";
  const STATUS_KEY = "status_reverse";

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // ============================================
  // LOAD DATA AWAL
  // ============================================
  useEffect(() => {
    loadUser();
    loadStatus();
    loadFormData();
  }, []);

  async function loadUser() {
    const stored = await AsyncStorage.getItem("user");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUserName(parsed?.name || "");
  }

  async function loadStatus() {
    const stored = await AsyncStorage.getItem(STATUS_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed?.etd) setEtdStatus(parsed.etd);
    if (parsed?.eta) setEtaStatus(parsed.eta);
  }

  async function loadFormData() {
    const stored = await AsyncStorage.getItem(FORM_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed?.plateNumber) setPlateNumber(parsed.plateNumber);
    if (parsed?.destinationIndex >= 0)
      setDestinationIndex(parsed.destinationIndex);
  }

  // auto save
  useEffect(() => {
    AsyncStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        plateNumber,
        destinationIndex,
      })
    );
  }, [plateNumber, destinationIndex]);

  function persistStatus(next: { etd?: string; eta?: string }) {
    const data = {
      etd: next.etd ?? etdStatus,
      eta: next.eta ?? etaStatus,
    };
    AsyncStorage.setItem(STATUS_KEY, JSON.stringify(data));
  }

  // ============================================
  // LOCATION (lebih akurat)
  // ============================================
  async function getAccurateCoords() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi",
          "Aktifkan izin lokasi agar posisi terkirim."
        );
        return null;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) return last.coords;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if ((loc.coords.accuracy ?? 9999) > 80) {
        Alert.alert("GPS belum stabil", "Tunggu sebentar lalu coba lagi.");
        return null;
      }

      return loc.coords;
    } catch {
      return null;
    }
  }

  // ============================================
  // API SEND (include lokasi)
  // ============================================
  async function sendStatus(
    body: any,
    opts?: {
      requireLocation?: boolean;
      coords?: Location.LocationObjectCoords;
      silent?: boolean;
    }
  ) {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return false;

      const requireLocation = opts?.requireLocation ?? false;
      const coords = opts?.coords ?? (await getAccurateCoords());
      if (requireLocation && !coords) return false;

      const payload: any = {
        direction: "reverse",
        origin: destinationIndex === 0 ? null : destinations[destinationIndex],
        destination: "PT Indonesia Koito",
        ...body,
      };

      if (coords) {
        payload.lat = coords.latitude;
        payload.lng = coords.longitude;
        payload.speed = coords.speed ?? null;
        payload.heading = coords.heading ?? null;
        payload.accuracy = coords.accuracy ?? null;
      }

      const res = await fetch(`${API_BASE}/api/status/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  function now() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }

  // ============================================
  // REALTIME TRACKING (ETD -> ETA reverse)
  // ============================================
  async function startRealtimeTrackingReverse() {
    stopRealtimeTracking();

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Lokasi",
        "Aktifkan izin lokasi agar realtime berjalan."
      );
      return;
    }

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      async (loc) => {
        await sendStatus({}, { coords: loc.coords, silent: true });
      }
    );
  }

  function stopRealtimeTracking() {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopRealtimeTracking();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  async function handleUpdateEtd() {
    if (destinationIndex === 0)
      return Alert.alert("Destinasi kosong", "Isi destinasi di Forward.");

    const t = now();
    const ok = await sendStatus({ etdTime: t }, { requireLocation: true });
    if (!ok) return Alert.alert("Gagal", "GPS belum siap / jaringan error");

    setEtdStatus("sent");
    persistStatus({ etd: "sent" });

    await startRealtimeTrackingReverse();

    Alert.alert("ETD Reverse terkirim", t);
  }

  async function handleUpdateEta() {
    if (destinationIndex === 0)
      return Alert.alert("Destinasi kosong", "Isi destinasi di Forward.");

    const t = now();
    const ok = await sendStatus({ etaTime: t }, { requireLocation: true });
    if (!ok) return Alert.alert("Gagal", "GPS belum siap / jaringan error");

    setEtaStatus("sent");
    persistStatus({ eta: "sent" });

    stopRealtimeTracking();

    Alert.alert("ETA Reverse terkirim", t);
  }

  async function handleLogout() {
    stopRealtimeTracking();

    await AsyncStorage.multiRemove([
      "user",
      "token",
      "forward_form",
      "status_forward",
      "reverse_form",
      "status_reverse",
    ]);

    router.replace("/login");
  }

  // ============================================
  // UI
  // ============================================
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.hello}>Hello, {userName}</Text>
          <Text style={styles.subtitle}>Your deliveries for today:</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconRow}>
            <Pressable
              onPress={() => router.replace("/(tabs)/forward")}
              style={styles.iconWrap}
            >
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={36}
                color="#6b7280"
              />
            </Pressable>

            <View style={[styles.iconWrap, styles.iconWrapActive]}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={36}
                color="#e8532a"
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </View>
          </View>

          {/* FROM */}
          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.colon}>:</Text>

            <Pressable
              style={styles.select}
              onPress={() => {
                Alert.alert(
                  "Pengaturan Forward",
                  "Destinasi diatur di Forward"
                );
              }}
            >
              <Text style={styles.selectText}>
                {destinations[destinationIndex]}
              </Text>
              <Ionicons name="chevron-down" size={18} />
            </Pressable>
          </View>

          {/* NOPOL */}
          <View style={styles.row}>
            <Text style={styles.label}>Nopol</Text>
            <Text style={styles.colon}>:</Text>

            <TextInput
              style={styles.input}
              value={plateNumber}
              editable={false}
            />
          </View>

          {/* TO */}
          <View style={styles.row}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>PT Indonesia Koito</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.statusValue}>
            {destinationIndex === 0
              ? "No destination"
              : destinations[destinationIndex]}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={etdStatus === "sent"}
              style={[
                styles.actionButton,
                styles.buttonPending,
                etdStatus === "sent" && { opacity: 0.6 },
              ]}
              onPress={handleUpdateEtd}
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
              onPress={handleUpdateEta}
            >
              <Text style={styles.actionText}>UPDATE ETA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
