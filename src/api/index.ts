import Constants from "expo-constants";

function pickHost(uri?: string | null) {
  if (!uri) return undefined;
  return uri.split(":")[0];
}

function resolveApiBase() {
  // 1) Explicit override
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }

  // 2) Use Expo host/debugger host (works in Expo Go / dev client)
  const expoConfig = Constants.expoConfig;
  const hostFromExpo = pickHost(expoConfig?.hostUri);
  if (hostFromExpo) return `http://${hostFromExpo}:3000`;

  const hostFromDebugger = pickHost(expoConfig?.extra?.expoGo?.debuggerHost);
  if (hostFromDebugger) return `http://${hostFromDebugger}:3000`;

  // 3) On web, reuse current hostname
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3000`;
  }

  // 4) Fallback
  return "http://localhost:3000";
}

export const API_BASE = resolveApiBase();
