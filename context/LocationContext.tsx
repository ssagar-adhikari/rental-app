import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export type UserLocation = {
  latitude: number;
  longitude: number;
  label: string;
  source: "gps" | "manual";
  updatedAt: string;
};

type LocationContextValue = {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestCurrentLocation: () => Promise<UserLocation | null>;
  setManualLocation: (coordinate: Pick<UserLocation, "latitude" | "longitude">) => Promise<UserLocation>;
};

const LOCATION_KEY = "rental_marketplace_user_location";
const DEFAULT_LOCATION = {
  latitude: 27.7172,
  longitude: 85.324,
};

const LocationContext = createContext<LocationContextValue | null>(null);

async function readStoredLocation(): Promise<UserLocation | null> {
  const raw =
    Platform.OS === "web"
      ? typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(LOCATION_KEY)
      : await SecureStore.getItemAsync(LOCATION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as UserLocation;
    return typeof parsed.latitude === "number" && typeof parsed.longitude === "number" ? parsed : null;
  } catch {
    return null;
  }
}

async function writeStoredLocation(location: UserLocation): Promise<void> {
  const value = JSON.stringify(location);

  if (Platform.OS === "web") {
    localStorage.setItem(LOCATION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(LOCATION_KEY, value);
}

function cleanAddressPart(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.toLowerCase() === "unnamed road") {
    return null;
  }

  return trimmed;
}

function joinUniqueAddressParts(parts: (string | null | undefined)[]) {
  const uniqueParts = parts.reduce<string[]>((items, part) => {
    const cleaned = cleanAddressPart(part);

    if (cleaned && !items.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      items.push(cleaned);
    }

    return items;
  }, []);

  return uniqueParts.join(", ");
}

export async function getLocationLabel(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const streetAddress = joinUniqueAddressParts([place?.streetNumber, place?.street]);
    const cityArea = joinUniqueAddressParts([
      place?.city,
      place?.district,
      place?.subregion,
      place?.region,
    ]);

    return cityArea || cleanAddressPart(place?.name) || streetAddress || cleanAddressPart(place?.formattedAddress) || "Selected location";
  } catch {
    return "Selected location";
  }
}

function buildLocation(
  coordinate: Pick<UserLocation, "latitude" | "longitude">,
  label: string,
  source: UserLocation["source"],
): UserLocation {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    label,
    source,
    updatedAt: new Date().toISOString(),
  };
}

export function LocationProvider({ children }: PropsWithChildren) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistLocation = useCallback(async (nextLocation: UserLocation) => {
    setLocation(nextLocation);
    await writeStoredLocation(nextLocation);
    return nextLocation;
  }, []);

  const requestCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError("Location permission was not granted.");
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const label = await getLocationLabel(coordinate.latitude, coordinate.longitude);

      return persistLocation(buildLocation(coordinate, label, "gps"));
    } catch {
      setError("Unable to get your current location.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [persistLocation]);

  const setManualLocation = useCallback(
    async (coordinate: Pick<UserLocation, "latitude" | "longitude">) => {
      setLoading(true);
      setError(null);

      try {
        const label = await getLocationLabel(coordinate.latitude, coordinate.longitude);
        return await persistLocation(buildLocation(coordinate, label, "manual"));
      } finally {
        setLoading(false);
      }
    },
    [persistLocation],
  );

  useEffect(() => {
    let mounted = true;

    async function bootLocation() {
      const storedLocation = await readStoredLocation();

      if (!mounted) {
        return;
      }

      if (storedLocation) {
        const refreshedLabel = await getLocationLabel(storedLocation.latitude, storedLocation.longitude);
        const refreshedLocation = {
          ...storedLocation,
          label: refreshedLabel,
        };

        setLocation(refreshedLocation);
        await writeStoredLocation(refreshedLocation);
        setLoading(false);

        if (storedLocation.source === "manual") {
          return;
        }
      }

      const nextLocation = await requestCurrentLocation();

      if (!nextLocation && !storedLocation && mounted) {
        setLocation(buildLocation(DEFAULT_LOCATION, "Kathmandu", "gps"));
      }
    }

    bootLocation();

    return () => {
      mounted = false;
    };
  }, [requestCurrentLocation]);

  const value = useMemo<LocationContextValue>(
    () => ({
      location,
      loading,
      error,
      requestCurrentLocation,
      setManualLocation,
    }),
    [error, loading, location, requestCurrentLocation, setManualLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useUserLocation must be used within LocationProvider");
  }

  return context;
}
