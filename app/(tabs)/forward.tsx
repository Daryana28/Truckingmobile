import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

    // ====== YIMM PG LOKAL ======
    "YIMM PG LOKAL PO 1",
    "YIMM PG LOKAL PO 2",
    "YIMM PG LOKAL PO 3",

    // ====== YIMM PG EXPORT ======
    "YIMM PG EXPORT C1",
    "YIMM PG EXPORT C2",

    // ====== YIMM KARAWANG ======
    "YIMM KARAWANG PO 1",
    "YIMM KARAWANG PO 2",
    "YIMM KARAWANG PO 3",

    // ====== SIM CIKARANG ======
    "SIM CIKARANG C1",
    "SIM CIKARANG C2",

    // ====== SIM TAMBUN / VUTEQ ======
    "SIM TAMBUN/VUTEQ",
  ];

  function getPlanTimes() {
    const key = destinations[destinationIndex];
    switch (key) {
      // ====== YIMM PG LOKAL ======
      case "YIMM PG LOKAL PO 1":
        return { etd: "05:00", eta: "08:00" };
      case "YIMM PG LOKAL PO 2":
        return { etd: "08:00", eta: "13:00" };
      case "YIMM PG LOKAL PO 3":
        return { etd: "14:00", eta: "19:00" };

      // ====== YIMM PG EXPORT ======
      case "YIMM PG EXPORT C1":
        return { etd: "05:00", eta: "08:00" };
      case "YIMM PG EXPORT C2":
        return { etd: "13:00", eta: "19:00" };

      // ====== YIMM KARAWANG ======
      case "YIMM KARAWANG PO 1":
        return { etd: "05:00", eta: "08:00" };
      case "YIMM KARAWANG PO 2":
        return { etd: "08:00", eta: "13:00" };
      case "YIMM KARAWANG PO 3":
        return { etd: "14:00", eta: "19:00" };

      // ====== SIM CIKARANG ======
      case "SIM CIKARANG C1":
        return { etd: "05:00", eta: "08:00" };
      case "SIM CIKARANG C2":
        return { etd: "12:00", eta: "15:00" };

      // ====== SIM TAMBUN / VUTEQ ======
      case "SIM TAMBUN/VUTEQ":
        return { etd: "10:00", eta: "15:00" };

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

  // ✅ NEW: delivery date (YYYY-MM-DD)
  const [deliveryDate, setDeliveryDate] = useState("");

  const FORM_KEY = "forward_form";
  const STATUS_KEY = "status_forward";
  const DELIVERY_DATE_KEY = "delivery_date";

  // ✅ realtime location subscription
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

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
    loadDeliveryDate();
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

  function todayYmdLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function isValidYmd(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test((s ?? "").trim());
  }

  async function loadDeliveryDate() {
    try {
      const stored = await AsyncStorage.getItem(DELIVERY_DATE_KEY);
      if (stored) setDeliveryDate(stored);
      else {
        const d = todayYmdLocal();
        setDeliveryDate(d);
        await AsyncStorage.setItem(DELIVERY_DATE_KEY, d);
      }
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

  // ✅ save delivery date
  useEffect(() => {
    if (!deliveryDate) return;
    AsyncStorage.setItem(DELIVERY_DATE_KEY, deliveryDate);
  }, [deliveryDate]);

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

      // ✅ sync deliveryDate juga
      if (deliveryDate) {
        await AsyncStorage.setItem(DELIVERY_DATE_KEY, deliveryDate);
      }
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
  // LOCATION (lebih akurat)
  // ============================
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
    } catch (e) {
      console.log("Gagal ambil lokasi:", e);
      return null;
    }
  }

  // ============================
  // SEND API (include deliveryDate)
  // ============================
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
      if (!token) {
        if (!opts?.silent) Alert.alert("Belum login", "Silakan login ulang.");
        return false;
      }

      const requireLocation = opts?.requireLocation ?? false;

      const coords = opts?.coords ?? (await getAccurateCoords());
      if (requireLocation && !coords) return false;

      const dd = (deliveryDate ?? "").trim();

      const payload: any = {
        direction: "forward",
        origin: "PT Indonesia Koito",
        destination:
          destinationIndex === 0 ? null : destinations[destinationIndex],

        // ✅ NEW
        deliveryDate: dd && isValidYmd(dd) ? dd : null,

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
    } catch (e) {
      console.log("sendStatus error:", e);
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
  // REALTIME TRACKING (ETD -> ETA)
  // ============================
  async function startRealtimeTrackingForward() {
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

  // ============================
  // HANDLERS
  // ============================
  async function handlePlate() {
    if (!plateNumber.trim())
      return Alert.alert("Nopol kosong", "Isi nomor polisi terlebih dahulu");

    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    const ok = await sendStatus(
      { plate: plateNumber },
      { requireLocation: false }
    );
    if (!ok) return Alert.alert("Gagal", "Coba lagi");

    setPlateStatus("sent");
    persistStatus({ plate: "sent" });

    await syncToReverse();
    Alert.alert("Success", "Nopol terkirim");
  }

  async function handleETD() {
    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    // ✅ pastikan deliveryDate valid
    const dd = (deliveryDate ?? "").trim();
    if (!isValidYmd(dd)) {
      return Alert.alert(
        "Delivery Date tidak valid",
        "Gunakan format YYYY-MM-DD (contoh: 2026-01-03)"
      );
    }

    const t = now();
    const ok = await sendStatus({ etdTime: t }, { requireLocation: true });
    if (!ok) return Alert.alert("Gagal", "GPS belum siap / jaringan error");

    setEtdStatus("sent");
    persistStatus({ etd: "sent" });

    await startRealtimeTrackingForward();

    Alert.alert("ETD dikirim", t);
  }

  async function handleETA() {
    if (destinationIndex === 0)
      return Alert.alert("Pilih Destinasi", "Anda harus memilih tujuan dahulu");

    const t = now();
    const ok = await sendStatus({ etaTime: t }, { requireLocation: true });
    if (!ok) return Alert.alert("Gagal", "GPS belum siap / jaringan error");

    setEtaStatus("sent");
    persistStatus({ eta: "sent" });

    stopRealtimeTracking();

    Alert.alert("ETA dikirim", t);
  }

  async function logout() {
    stopRealtimeTracking();

    // cek apakah reverse sudah complete (ETA reverse sent)
    let reverseEta = "pending";
    try {
      const storedRev = await AsyncStorage.getItem("status_reverse");
      if (storedRev) {
        const parsed = JSON.parse(storedRev);
        reverseEta = parsed?.eta ?? "pending";
      }
    } catch {}

    // ✅ hapus auth saja, jangan hapus form/status kalau belum complete
    await AsyncStorage.multiRemove(["user", "token"]);

    // ✅ kalau complete → reset semuanya biar ready delivery berikutnya
    if (reverseEta === "sent") {
      await AsyncStorage.multiRemove([
        "forward_form",
        "status_forward",
        "reverse_form",
        "status_reverse",
        DELIVERY_DATE_KEY,
      ]);

      setPlateNumber("");
      setDestinationIndex(0);
      setPlateStatus("pending");
      setEtdStatus("pending");
      setEtaStatus("pending");
      setDeliveryDate(todayYmdLocal());
    }

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

          {/* FROM */}
          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>PT Indonesia Koito</Text>
          </View>

          {/* ✅ DELIVERY DATE */}
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              editable={etdStatus !== "sent"} // kunci setelah ETD
            />
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
                  styles.buttonPending,
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
                  styles.buttonPending,
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
