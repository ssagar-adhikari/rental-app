import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function readJsonCache<T>(key: string): Promise<T | null> {
  const raw =
    Platform.OS === "web"
      ? typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(key)
      : await SecureStore.getItemAsync(key).catch(() => null);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonCache<T>(key: string, value: T): Promise<void> {
  const raw = JSON.stringify(value);

  if (Platform.OS === "web") {
    localStorage.setItem(key, raw);
    return;
  }

  await SecureStore.setItemAsync(key, raw).catch(() => null);
}
