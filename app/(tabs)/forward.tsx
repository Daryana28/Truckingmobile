import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type PlanItem = {
  deliveryDate: string;
  destination: string;
  group: string | null;
  forwardEtd: string | null;
  forwardEta: string | null;
  reverseEtd: string | null;
  reverseEta: string | null;
  updatedAt?: string | null;
};

export default function ForwardScreen() {
  // ============================
  // ✅ DESTINATIONS dari API (fallback hardcode jika gagal)
  // ============================
  const fallbackDestinations = [
    "Select Destinasi",
    "YIMM PG LOKAL PO 1",
    "YIMM PG LOKAL PO 2",
    "YIMM PG LOKAL PO 3",
    "YIMM PG EXPORT C1",
    "YIMM PG EXPORT C2",
    "YIMM KARAWANG PO 1",
    "YIMM KARAWANG PO 2",
    "YIMM KARAWANG PO 3",
    "SIM CIKARANG C1",
    "SIM CIKARANG C2",
    "SIM TAMBUN/VUTEQ",
  ];

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

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planRefreshing, setPlanRefreshing] = useState(false);

  // ✅ deliveryDate dari server (bukan driver)
  const [deliveryDate, setDeliveryDate] = useState<string>(todayYmdLocal());

  const planMap = useMemo(() => {
    const m = new Map<string, PlanItem>();
    for (const p of plans) {
      if (p?.destination) m.set(p.destination, p);
    }
    return m;
  }, [plans]);

  const destinations = useMemo(() => {
    if (plans.length)
      return ["Select Destinasi", ...plans.map((p) => p.destination)];
    return fallbackDestinations;
  }, [plans]);

  // ✅ NEW: key untuk share delivery date ke reverse (biar ikut otomatis kayak nopol)
  const DELIVERY_DATE_KEY = "delivery_date";

  async function fetchPlans(opts?: { silent?: boolean }) {
    try {
      if (!opts?.silent) setPlanErr(null);

      const date = todayYmdLocal(); // plan default “today”
      const res = await fetch(
        `${API_BASE}/api/plan/list?deliveryDate=${encodeURIComponent(date)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok && Array.isArray(json?.plans)) {
        setPlans(json.plans as PlanItem[]);

        // ✅ ambil deliveryDate dari API kalau ada
        const dd = (json?.deliveryDate ?? "").trim();
        const finalDd = dd && isValidYmd(dd) ? dd : date;

        setDeliveryDate(finalDd);

        // ✅ SIMPAN ke AsyncStorage supaya Reverse otomatis ikut
        await AsyncStorage.setItem(DELIVERY_DATE_KEY, finalDd);
      } else {
        if (!opts?.silent) setPlanErr(json?.error ?? "Gagal memuat plan.");
        setDeliveryDate(date);

        // ✅ tetap simpan fallback date supaya reverse ada value
        await AsyncStorage.setItem(DELIVERY_DATE_KEY, date);
      }
    } catch {
      if (!opts?.silent) setPlanErr("Gagal memuat plan (cek koneksi/server).");
      const dd = todayYmdLocal();
      setDeliveryDate(dd);

      // ✅ simpan agar reverse ikut
      await AsyncStorage.setItem(DELIVERY_DATE_KEY, dd);
    } finally {
      setPlanLoaded(true);
    }
  }

  useEffect(() => {
    fetchPlans({ silent: true });
  }, []);

  // optional: auto refresh tiap 60 detik
  useEffect(() => {
    const id = setInterval(() => fetchPlans({ silent: true }), 60000);
    return () => clearInterval(id);
  }, []);

  async function refreshPlanManual() {
    setPlanRefreshing(true);
    await fetchPlans({ silent: false });
    setPlanRefreshing(false);
  }

  function getPlanTimes() {
    const key = destinations[destinationIndex];
    const p = planMap.get(key);
    if (!p) return { etd: "-", eta: "-" };
    return { etd: p.forwardEtd ?? "-", eta: p.forwardEta ?? "-" };
  }

  // ============================
  // STATE (tetap)
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
  // LOAD DATA (tetap)
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

  // AUTO SAVE FORM (tetap)
  useEffect(() => {
    AsyncStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        plateNumber,
        destinationIndex,
      })
    );
  }, [plateNumber, destinationIndex]);

  // ✅ kalau plan berubah dan destinasi sebelumnya sudah tidak ada, reset index ke 0
  useEffect(() => {
    const current = destinations[destinationIndex];
    if (!current) return;

    if (destinationIndex > 0 && plans.length > 0) {
      const exists = planMap.has(current);
      if (!exists) setDestinationIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  // SYNC TO REVERSE (tetap)
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
  // LOCATION (tetap)
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
  // SEND API (deliveryDate dari plan)
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

      const dd = (deliveryDate ?? "").trim() || todayYmdLocal();

      const payload: any = {
        direction: "forward",
        origin: "PT Indonesia Koito",
        destination:
          destinationIndex === 0 ? null : destinations[destinationIndex],
        deliveryDate: isValidYmd(dd) ? dd : todayYmdLocal(),
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
  // REALTIME TRACKING (tetap)
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
  // HANDLERS (tetap)
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

    let reverseEta = "pending";
    try {
      const storedRev = await AsyncStorage.getItem("status_reverse");
      if (storedRev) {
        const parsed = JSON.parse(storedRev);
        reverseEta = parsed?.eta ?? "pending";
      }
    } catch {}

    await AsyncStorage.multiRemove(["user", "token"]);

    if (reverseEta === "sent") {
      await AsyncStorage.multiRemove([
        "forward_form",
        "status_forward",
        "reverse_form",
        "status_reverse",
      ]);

      setPlateNumber("");
      setDestinationIndex(0);
      setPlateStatus("pending");
      setEtdStatus("pending");
      setEtaStatus("pending");
    }

    router.replace("/login");
  }

  // ============================
  // UI (delivery date read-only)
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

          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>PT Indonesia Koito</Text>
          </View>

          {/* ✅ DELIVERY DATE (AUTO, READONLY) */}
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={styles.input}
              value={deliveryDate}
              editable={false}
            />
          </View>

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

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={refreshPlanManual}
              disabled={planRefreshing}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
                opacity: planRefreshing ? 0.6 : 1,
              }}
            >
              <Text style={{ fontWeight: "700", color: "#374151" }}>
                {planRefreshing ? "Refreshing..." : "Refresh Plan"}
              </Text>
            </TouchableOpacity>

            <View style={{ marginLeft: 10 }}>
              {!planLoaded ? (
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  Memuat plan dari server...
                </Text>
              ) : planErr ? (
                <Text style={{ color: "#b91c1c", fontSize: 12 }}>
                  {planErr}
                </Text>
              ) : plans.length ? (
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  Plan {deliveryDate}: {plans.length} destinasi
                </Text>
              ) : (
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  Plan kosong (pakai fallback)
                </Text>
              )}
            </View>
          </View>
        </View>

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
