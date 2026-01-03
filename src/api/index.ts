// src/api/index.ts
import Constants from "expo-constants";

function extractHost(hostUri?: string | null) {
  if (!hostUri) return undefined;

  // contoh hostUri:
  // - "192.168.1.3:8081"
  // - "exp://192.168.1.3:8081"
  // - "192.168.1.3:19000"
  // - "localhost:8081"
  const cleaned = hostUri
    .replace(/^exp:\/\//, "")
    .replace(/^http:\/\//, "")
    .replace(/^https:\/\//, "");
  return cleaned.split(":")[0]; // ambil host saja (tanpa port)
}

function resolveApiBase() {
  // ✅ Production domain (dipakai kalau bener-bener production / tidak bisa deteksi host)
  const PROD_DOMAIN = "https://www.dycode.web.id";

  // 0) Prioritas tertinggi: env override (paling enak buat dev)
  // set di .env:
  // EXPO_PUBLIC_API_BASE=http://192.168.1.3:3000
  const envBase = process.env.EXPO_PUBLIC_API_BASE;
  if (envBase && envBase.trim().length > 0) return envBase.trim();

  // 1) Ambil dari app.json -> expo.extra.apiBase (kalau ada)
  const expoConfig = Constants.expoConfig;
  const extraBase = expoConfig?.extra?.apiBase;
  if (extraBase && String(extraBase).trim().length > 0)
    return String(extraBase).trim();

  // 2) Expo Go / Dev Client: ambil host dari hostUri
  // ini yang biasanya paling akurat saat kamu jalanin `npx expo start`
  const hostFromHostUri = extractHost(expoConfig?.hostUri);
  if (hostFromHostUri) {
    // ✅ Next.js kamu jalan di port 3000
    return `http://${hostFromHostUri}:3000`;
  }

  // 3) Debugger host (kadang ada di extra)
  const debuggerHost = extractHost(
    (expoConfig as any)?.extra?.expoGo?.debuggerHost
  );
  if (debuggerHost) return `http://${debuggerHost}:3000`;

  // 4) Web (kalau expo web)
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3000`;
  }

  // 5) Fallback terakhir: production
  return PROD_DOMAIN;
}

export const API_BASE = resolveApiBase();
