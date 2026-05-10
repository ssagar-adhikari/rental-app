import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, type Href } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingsContext";
import { useListings } from "@/context/ListingsContext";
import type { ApiBooking } from "@/types/rental";

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

function formatMoney(value: number, currency: string) {
  if (!Number.isFinite(value) || value <= 0) {
    return `${currency} 0`;
  }

  return `${currency} ${Math.round(value).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not set";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function statusColor(status: string) {
  if (status === "pending") return Colors.light.warning;
  if (status === "confirmed") return Colors.light.primary;
  if (status === "active" || status === "completed") return Colors.light.success;
  if (status === "cancelled") return Colors.light.danger;

  return Colors.light.muted;
}

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function VendorDashboardScreen() {
  const { user, loading, logout, selectRole } = useAuth();
  const { refreshVendorListings, vendorListings, vendorLoading } = useListings();
  const { bookingMetrics, refreshVendorBookings, vendorBookings, vendorBookingsLoading, vendorBookingsError } = useBookings();
  const activeListingCount = vendorListings.filter((listing) => listing.status !== "archived").length;
  const pendingListingCount = vendorListings.filter((listing) => listing.status === "pending").length;
  const recentBookings = vendorBookings.slice(0, 3);
  const bookingsLoading = vendorBookingsLoading && vendorBookings.length === 0;

  const metrics: Metric[] = [
    { icon: "home-outline", label: "Listings", value: vendorLoading ? "..." : String(activeListingCount), color: Colors.light.primary },
    { icon: "time-outline", label: "Pending", value: vendorLoading ? "..." : String(pendingListingCount), color: Colors.light.warning },
    { icon: "calendar-outline", label: "Bookings", value: bookingsLoading ? "..." : String(bookingMetrics.total), color: Colors.light.success },
    {
      icon: "cash-outline",
      label: "Expected",
      value: bookingsLoading ? "..." : formatMoney(bookingMetrics.expectedRevenue, bookingMetrics.currency),
      color: "#7C3AED",
    },
  ];

  const actions: Action[] = [
    { icon: "add-circle-outline", label: "Add Listing", onPress: () => router.push("/vendor-listing-form" as Href) },
    { icon: "list-outline", label: "Manage Listings", onPress: () => router.push("/vendor-listings" as Href) },
    { icon: "calendar-number-outline", label: "Manage Bookings", onPress: () => router.push("/vendor-bookings" as Href) },
    { icon: "person-outline", label: "Profile", onPress: () => router.push("/(tabs)/profile" as Href) },
  ];

  useEffect(() => {
    refreshVendorListings();
    refreshVendorBookings({ per_page: 100 });
  }, [refreshVendorBookings, refreshVendorListings]);

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
            accessibilityLabel="Switch to customer marketplace"
            accessibilityRole="button"
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
          <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>Vendor Tools</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/vendor-bookings" as Href)}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {vendorBookingsError ? (
            <View style={styles.inlineState}>
              <Ionicons name="cloud-offline-outline" size={18} color={Colors.light.danger} />
              <Text style={[styles.inlineStateText, styles.inlineStateDanger]}>{vendorBookingsError}</Text>
            </View>
          ) : null}

          {bookingsLoading ? (
            <>
              <View style={styles.bookingSkeleton} />
              <View style={styles.bookingSkeleton} />
            </>
          ) : null}

          {!bookingsLoading && recentBookings.length === 0 ? (
            <View style={styles.inlineState}>
              <Ionicons name="calendar-clear-outline" size={18} color={Colors.light.muted} />
              <Text style={styles.inlineStateText}>No booking requests yet.</Text>
            </View>
          ) : null}

          {!bookingsLoading
            ? recentBookings.map((booking) => <RecentBookingRow key={booking.id} booking={booking} />)
            : null}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function RecentBookingRow({ booking }: { booking: ApiBooking }) {
  const color = statusColor(booking.status);

  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingRowIcon}>
        <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
      </View>
      <View style={styles.bookingRowBody}>
        <Text style={styles.bookingRowTitle} numberOfLines={1}>
          {booking.listing?.title ?? booking.booking_number}
        </Text>
        <Text style={styles.bookingRowMeta}>
          {formatDate(booking.start_at)} - {formatMoney(Number(booking.total_amount ?? 0), booking.currency ?? "NPR")}
        </Text>
      </View>
      <Text style={[styles.bookingRowStatus, { color }]}>{statusLabel(booking.status)}</Text>
    </View>
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
    height: 44,
    justifyContent: "center",
    width: 44,
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
    height: 44,
    justifyContent: "center",
    width: 44,
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
    ...Typography.label,
    fontWeight: "900",
  },
  sectionTitleSpacing: {
    marginBottom: Spacing.sm,
  },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionLink: {
    color: Colors.light.primary,
    ...Typography.label,
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
  inlineState: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 46,
  },
  inlineStateText: {
    color: Colors.light.muted,
    flex: 1,
    ...Typography.body,
  },
  inlineStateDanger: {
    color: Colors.light.danger,
  },
  bookingSkeleton: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 54,
    marginTop: Spacing.sm,
  },
  bookingRow: {
    alignItems: "center",
    borderTopColor: "#EEF1F7",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 68,
  },
  bookingRowIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  bookingRowBody: {
    flex: 1,
  },
  bookingRowTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontSize: 15,
  },
  bookingRowMeta: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  bookingRowStatus: {
    ...Typography.label,
    fontWeight: "900",
  },
});
