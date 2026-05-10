import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SearchBar } from "@/components/SearchBar";
import { Colors, Radius, Spacing, TouchTarget, Typography } from "@/constants/theme";
import { useUserLocation } from "@/context/LocationContext";
import { lightImpactHaptic, selectionHaptic } from "@/utils/haptics";

export default function Header() {
  const { location, loading } = useUserLocation();
  const locationLabel = loading && !location ? "Detecting location..." : location?.label ?? "Set location";

  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <View>
          <TouchableOpacity
            accessibilityLabel={`Change location. Current location: ${locationLabel}`}
            accessibilityRole="button"
            activeOpacity={0.78}
            style={styles.locationButton}
            onPress={() => {
              lightImpactHaptic();
              router.push("/location-picker");
            }}
          >
            <Ionicons name="location-outline" size={15} color={Colors.light.onPrimarySubtle} />
            <Text style={styles.location} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.light.onPrimarySubtle} />
          </TouchableOpacity>
          <Text style={styles.title}>Find your next place</Text>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity accessibilityLabel="Saved listings" accessibilityRole="button" activeOpacity={0.8} style={styles.iconBtn} onPress={selectionHaptic}>
            <Ionicons name="heart-outline" size={21} color="white" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Notifications" accessibilityRole="button" activeOpacity={0.8} style={styles.iconBtn} onPress={selectionHaptic}>
            <Ionicons name="notifications-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Browse verified rentals, vehicles, services, and essentials near you.
      </Text>

      <SearchBar placeholder="Search area, room, apartment..." />

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Ionicons name="shield-checkmark-outline" size={15} color={Colors.light.success} />
          <Text style={styles.statText}>Verified</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="sparkles-outline" size={15} color={Colors.light.warning} />
          <Text style={styles.statText}>Fresh listings</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 45,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.onPrimarySurface,
  },
  location: {
    color: Colors.light.onPrimaryMuted,
    maxWidth: 170,
    ...Typography.label,
  },
  locationButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    marginBottom: Spacing.xs,
    maxWidth: 220,
    minHeight: TouchTarget.min,
  },
  title: {
    color: "white",
    ...Typography.screenTitle,
  },
  subtitle: {
    color: Colors.light.onPrimarySubtle,
    ...Typography.body,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.light.onPrimarySurface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  statText: {
    color: "white",
    ...Typography.eyebrow,
  },
});
