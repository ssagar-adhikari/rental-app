import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps/lib/MapView";
import Marker from "react-native-maps/lib/MapMarker";
import { PROVIDER_GOOGLE } from "react-native-maps/lib/ProviderConstants";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { getLocationLabel, useUserLocation } from "@/context/LocationContext";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_COORDINATE: Coordinate = {
  latitude: 27.7172,
  longitude: 85.324,
};

export default function LocationPickerScreen() {
  const { error, loading, location, requestCurrentLocation, setManualLocation } = useUserLocation();
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate>(
    location ? { latitude: location.latitude, longitude: location.longitude } : DEFAULT_COORDINATE,
  );
  const [previewLabel, setPreviewLabel] = useState(location?.label ?? "Selected location");
  const [resolvingLabel, setResolvingLabel] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (location) {
      setSelectedCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setPreviewLabel(location.label);
    }
  }, [location]);

  async function chooseCoordinate(coordinate: Coordinate) {
    setSelectedCoordinate(coordinate);
    setResolvingLabel(true);

    try {
      setPreviewLabel(await getLocationLabel(coordinate.latitude, coordinate.longitude));
    } finally {
      setResolvingLabel(false);
    }
  }

  const region = useMemo(
    () => ({
      ...selectedCoordinate,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [selectedCoordinate],
  );

  async function useCurrentLocation() {
    const nextLocation = await requestCurrentLocation();

    if (nextLocation) {
      await chooseCoordinate({
        latitude: nextLocation.latitude,
        longitude: nextLocation.longitude,
      });
    }
  }

  async function saveLocation() {
    setSaving(true);

    try {
      await setManualLocation(selectedCoordinate);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" activeOpacity={0.85} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Location</Text>
          <Text style={styles.title}>Set your area</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Use current location"
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={loading}
          style={[styles.currentButton, loading && styles.disabledButton]}
          onPress={useCurrentLocation}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="navigate-outline" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          initialRegion={region}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          region={region}
          style={styles.map}
          onPress={(event: { nativeEvent: { coordinate: Coordinate } }) => chooseCoordinate(event.nativeEvent.coordinate)}
        >
          <Marker
            coordinate={selectedCoordinate}
            draggable
            title="Selected location"
            onDragEnd={(event: { nativeEvent: { coordinate: Coordinate } }) => chooseCoordinate(event.nativeEvent.coordinate)}
          />
        </MapView>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.locationPreview}>
          <View style={styles.previewIcon}>
            <Ionicons name="location" size={22} color={Colors.light.primary} />
          </View>
          <View style={styles.previewText}>
            <Text style={styles.previewTitle}>{resolvingLabel ? "Finding place name..." : previewLabel}</Text>
            <Text style={styles.previewSubtitle}>
              {selectedCoordinate.latitude.toFixed(5)}, {selectedCoordinate.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        <Text style={styles.helperText}>
          Use the current-location button when available, then save to confirm the area used for registration and nearby listings.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.88} disabled={saving || resolvingLabel} style={[styles.saveButton, (saving || resolvingLabel) && styles.disabledButton]} onPress={saveLocation}>
          {saving ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="checkmark-circle-outline" size={21} color="white" />}
          <Text style={styles.saveText}>{saving ? "Saving..." : resolvingLabel ? "Checking location..." : "Save Location"}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: 48,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    ...Typography.label,
  },
  title: {
    color: "white",
    marginTop: 2,
    ...Typography.sectionTitle,
  },
  currentButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: Colors.light.surface,
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  locationPreview: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  previewIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  previewSubtitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.label,
  },
  helperText: {
    color: Colors.light.muted,
    marginTop: Spacing.md,
    ...Typography.body,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    marginTop: Spacing.lg,
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.72,
  },
  saveText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
});
