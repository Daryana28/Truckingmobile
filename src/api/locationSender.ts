import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { API_BASE } from "./index";

let watcher: Location.LocationSubscription | null = null;

export async function startLocationTracking(driverId: string) {
  // stop watcher sebelumnya kalau ada
  if (watcher) {
    watcher.remove();
    watcher = null;
  }

  // pastikan izin sudah diberikan
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    console.log("❌ Izin lokasi belum diberikan");
    return;
  }

  // AMBIL TOKEN
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    console.log("❌ TOKEN TIDAK ADA, tidak bisa kirim lokasi");
    return;
  }

  console.log("📍 MEMULAI TRACKING FOREGROUND");

  watcher = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 1,
    },
    async (loc) => {
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const heading = loc.coords.heading ?? 0;

      console.log("📡 KIRIM LOKASI:", lat, lng, heading);

      try {
        await fetch(`${API_BASE}/api/locations/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // 🔥 sangat penting!
          },
          body: JSON.stringify({
            lat,
            lng,
            heading,
            driverId,
          }),
        });
      } catch (err) {
        console.log("❌ Gagal kirim lokasi:", err);
      }
    }
  );
}

export function stopLocationTracking() {
  if (watcher) {
    watcher.remove();
    watcher = null;
  }
}
