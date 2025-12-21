// src/api/index.ts
import Constants from "expo-constants";

function pickHost(uri?: string | null) {
  if (!uri) return undefined;
  return uri.split(":")[0];
}

function resolveApiBase() {
  // ✅ DOMAIN PROD (fallback utama untuk APK/production)
  const PROD_DOMAIN = "https://www.dycode.web.id";

  // 1) Explicit override (paling prioritas)
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }

  // ✅ 1.5) Ambil dari app.json -> expo.extra.apiBase (kalau ada)
  const expoConfig = Constants.expoConfig;
  const apiBaseFromExtra = expoConfig?.extra?.apiBase;
  if (apiBaseFromExtra) return String(apiBaseFromExtra);

  // 2) Use Expo host/debugger host (works in Expo Go / dev client)
  const hostFromExpo = pickHost(expoConfig?.hostUri);
  if (hostFromExpo) return `http://${hostFromExpo}:3000`;

  const hostFromDebugger = pickHost(expoConfig?.extra?.expoGo?.debuggerHost);
  if (hostFromDebugger) return `http://${hostFromDebugger}:3000`;

  // 3) On web, reuse current hostname
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3000`;
  }

  // 4) Fallback (✅ ganti dari localhost ke domain production)
  return PROD_DOMAIN;
}

export const API_BASE = resolveApiBase();
