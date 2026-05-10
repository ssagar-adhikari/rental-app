import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const RECENT_SEARCHES_KEY = "rental_marketplace_recent_searches";
const MAX_RECENT_SEARCHES = 6;

function cleanSearchTerm(term: string) {
  return term.trim().replace(/\s+/g, " ");
}

export async function readRecentSearches() {
  const raw =
    Platform.OS === "web"
      ? typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(RECENT_SEARCHES_KEY)
      : await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);

  if (!raw) {
    return [];
  }

  try {
    const values = JSON.parse(raw) as unknown;

    return Array.isArray(values) ? values.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function writeRecentSearches(searches: string[]) {
  const value = JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES));

  if (Platform.OS === "web") {
    localStorage.setItem(RECENT_SEARCHES_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, value);
}

export async function rememberRecentSearch(term: string) {
  const cleanedTerm = cleanSearchTerm(term);

  if (!cleanedTerm) {
    return readRecentSearches();
  }

  const currentSearches = await readRecentSearches();
  const nextSearches = [
    cleanedTerm,
    ...currentSearches.filter((item) => item.toLowerCase() !== cleanedTerm.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);

  await writeRecentSearches(nextSearches);
  return nextSearches;
}

export async function clearRecentSearches() {
  if (Platform.OS === "web") {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
}
