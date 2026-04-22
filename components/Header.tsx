import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SearchBar } from "@/components/SearchBar";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <View>
          <Text style={styles.location}>Kathmandu</Text>
          <Text style={styles.title}>Find your next place</Text>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={21} color="white" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
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
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  location: {
    color: "rgba(255,255,255,0.72)",
    marginBottom: Spacing.xs,
    ...Typography.label,
  },
  title: {
    color: "white",
    ...Typography.screenTitle,
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
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
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
  },
  statText: {
    color: "white",
    ...Typography.eyebrow,
  },
});
