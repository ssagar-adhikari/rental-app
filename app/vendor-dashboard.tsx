import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, type Href } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

type Metric = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
};

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const metrics: Metric[] = [
  { icon: "home-outline", label: "Listings", value: "0", color: Colors.light.primary },
  { icon: "calendar-outline", label: "Bookings", value: "0", color: Colors.light.success },
  { icon: "cash-outline", label: "Revenue", value: "Rs 0", color: Colors.light.warning },
  { icon: "chatbubble-ellipses-outline", label: "Messages", value: "0", color: "#7C3AED" },
];

const actions: Action[] = [
  { icon: "add-circle-outline", label: "Add Listing", onPress: () => null },
  { icon: "calendar-number-outline", label: "Manage Bookings", onPress: () => null },
  { icon: "wallet-outline", label: "Payouts", onPress: () => null },
  { icon: "person-outline", label: "Profile", onPress: () => router.push("/(tabs)/profile" as Href) },
];

export default function VendorDashboardScreen() {
  const { user, loading, logout, selectRole } = useAuth();

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.roles.includes("vendor")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  async function switchToCustomer() {
    await selectRole("customer");
    router.replace("/(tabs)" as Href);
  }

  return (
    <Screen>
      <AppHeader
        eyebrow="Vendor"
        title="Dashboard"
        subtitle={`Welcome back, ${user.name}.`}
        icon="storefront-outline"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBand}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.light.success} />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>Vendor account active</Text>
            <Text style={styles.statusSubtitle}>{user.email}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.marketButton}
            onPress={user.roles.includes("customer") ? switchToCustomer : () => router.push("/(tabs)" as Href)}
          >
            <Ionicons name="bag-handle-outline" size={18} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}18` }]}>
                <Ionicons name={metric.icon} size={20} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Tools</Text>
          {actions.map((action) => (
            <TouchableOpacity activeOpacity={0.85} key={action.label} style={styles.actionRow} onPress={action.onPress}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={20} color={Colors.light.primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#AAB2C3" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 110,
  },
  statusBand: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  statusIcon: {
    alignItems: "center",
    backgroundColor: "#EAF8F0",
    borderRadius: Radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  statusSubtitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  marketButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  metricCard: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 128,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: Radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  metricValue: {
    color: Colors.light.text,
    marginTop: Spacing.lg,
    ...Typography.sectionTitle,
  },
  metricLabel: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    color: Colors.light.muted,
    marginBottom: Spacing.sm,
    ...Typography.label,
    fontWeight: "900",
  },
  actionRow: {
    alignItems: "center",
    borderBottomColor: "#EEF1F7",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 58,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  actionLabel: {
    color: Colors.light.text,
    flex: 1,
    marginLeft: Spacing.md,
    ...Typography.cardTitle,
    fontWeight: "800",
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    minHeight: 52,
  },
  logoutText: {
    color: Colors.light.danger,
    ...Typography.label,
    fontWeight: "900",
  },
});
