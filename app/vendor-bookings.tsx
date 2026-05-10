import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useBookings } from "@/context/BookingsContext";
import { getListingImage, getListingLocation } from "@/services/listingApi";
import type { ApiBooking } from "@/types/rental";

type StatusFilter = "all" | "pending" | "confirmed" | "active" | "cancelled" | "completed";

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const fallbackBookingImage = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200";

const statusTone: Record<string, { color: string; background: string }> = {
  pending: { color: Colors.light.warning, background: "#FEF3C7" },
  confirmed: { color: Colors.light.primary, background: "#E8EDFF" },
  active: { color: Colors.light.success, background: "#EAF8F0" },
  completed: { color: Colors.light.success, background: "#EAF8F0" },
  cancelled: { color: Colors.light.danger, background: "#FEF2F2" },
};

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
    year: "numeric",
  });
}

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Price pending";
  }

  return `${currency ?? "NPR"} ${Math.round(amount).toLocaleString()}`;
}

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function BookingSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </View>
  );
}

export default function VendorBookingsScreen() {
  const { user, loading } = useAuth();
  const {
    vendorBookings,
    vendorBookingsLoading,
    vendorBookingsRefreshing,
    vendorBookingsLoadingMore,
    vendorBookingsError,
    hasMoreVendorBookings,
    refreshVendorBookings,
    loadMoreVendorBookings,
    cancelVendorBooking,
  } = useBookings();
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    refreshVendorBookings({ status: selectedStatus === "all" ? undefined : selectedStatus });
  }, [refreshVendorBookings, selectedStatus]);

  const refresh = useCallback(() => {
    refreshVendorBookings({ status: selectedStatus === "all" ? undefined : selectedStatus });
  }, [refreshVendorBookings, selectedStatus]);

  const confirmCancel = useCallback(
    (booking: ApiBooking) => {
      Alert.alert("Cancel booking?", "This will mark the booking as cancelled for both vendor and customer.", [
        { text: "Keep booking", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            setCancellingId(booking.id);

            try {
              await cancelVendorBooking(booking.id, "Cancelled by vendor");
              await refreshVendorBookings({ status: selectedStatus === "all" ? undefined : selectedStatus });
            } catch (exception) {
              Alert.alert("Could not cancel booking", exception instanceof Error ? exception.message : "Please try again.");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]);
    },
    [cancelVendorBooking, refreshVendorBookings, selectedStatus],
  );

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

  function renderBooking({ item }: { item: ApiBooking }) {
    const tone = statusTone[item.status] ?? { color: Colors.light.muted, background: Colors.light.surfaceMuted };
    const listing = item.listing;
    const canCancel = item.status !== "cancelled" && item.status !== "completed";

    return (
      <View style={styles.card}>
        <Image source={{ uri: listing ? getListingImage(listing) : fallbackBookingImage }} style={styles.bookingImage} />

        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.bookingNumber}>{item.booking_number}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {listing?.title ?? "Listing unavailable"}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
            <Text style={[styles.statusText, { color: tone.color }]}>{statusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.muted} />
            <Text style={styles.detailText}>
              {formatDate(item.start_at)} - {formatDate(item.end_at)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={Colors.light.muted} />
            <Text style={styles.detailText} numberOfLines={1}>
              {listing ? getListingLocation(listing) : "Location unavailable"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={Colors.light.muted} />
            <Text style={styles.detailText}>
              {item.guest_count ?? item.quantity ?? 1} {Number(item.guest_count ?? item.quantity ?? 1) === 1 ? "guest" : "guests"}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.light.muted} />
            <Text style={styles.detailText}>{formatMoney(item.total_amount, item.currency)}</Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.notes} numberOfLines={3}>{item.notes}</Text> : null}

        <View style={styles.cardFooter}>
          <Text style={styles.createdText}>Requested {formatDate(item.created_at)}</Text>

          {canCancel ? (
            <TouchableOpacity
              accessibilityLabel={`Cancel booking ${item.booking_number ?? item.id}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: cancellingId === item.id, busy: cancellingId === item.id }}
              activeOpacity={0.85}
              disabled={cancellingId === item.id}
              style={styles.cancelButton}
              onPress={() => confirmCancel(item)}
            >
              {cancellingId === item.id ? (
                <ActivityIndicator color={Colors.light.danger} size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={17} color={Colors.light.danger} />
                  <Text style={styles.cancelText}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <AppHeader
        eyebrow="Vendor"
        title="Bookings"
        subtitle="Review booking requests and manage customer reservations."
        icon="calendar-number-outline"
      />

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const selected = selectedStatus === item.value;

            return (
              <TouchableOpacity
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                activeOpacity={0.85}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setSelectedStatus(item.value)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {vendorBookingsError ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={20} color={Colors.light.danger} />
          <Text style={styles.errorText}>{vendorBookingsError}</Text>
          <TouchableOpacity
            accessibilityLabel="Retry loading bookings"
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.retryButton}
            onPress={refresh}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {vendorBookingsLoading ? (
        <View style={styles.listContent}>
          <BookingSkeleton />
          <BookingSkeleton />
          <BookingSkeleton />
        </View>
      ) : (
        <FlatList
          data={vendorBookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBooking}
          contentContainerStyle={[styles.listContent, vendorBookings.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={vendorBookingsRefreshing} onRefresh={refresh} tintColor={Colors.light.primary} />}
          onEndReached={hasMoreVendorBookings ? loadMoreVendorBookings : undefined}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={34} color={Colors.light.muted} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>Bookings from customers will appear here once they request a listing.</Text>
            </View>
          }
          ListFooterComponent={
            vendorBookingsLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={Colors.light.primary} />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  filterWrap: {
    marginTop: Spacing.lg,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  filterChip: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    color: Colors.light.muted,
    ...Typography.label,
  },
  filterTextSelected: {
    color: "white",
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.body,
  },
  retryButton: {
    backgroundColor: "white",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  retryText: {
    color: Colors.light.danger,
    ...Typography.label,
  },
  listContent: {
    gap: Spacing.lg,
    padding: Spacing.xl,
    paddingBottom: 110,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  bookingImage: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 136,
    marginBottom: Spacing.md,
    width: "100%",
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
  },
  bookingNumber: {
    color: Colors.light.muted,
    marginBottom: 2,
    ...Typography.label,
  },
  title: {
    color: Colors.light.text,
    ...Typography.cardTitle,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    ...Typography.label,
    fontWeight: "900",
  },
  detailGrid: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  detailItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  detailText: {
    color: Colors.light.muted,
    flex: 1,
    ...Typography.body,
  },
  notes: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    color: Colors.light.text,
    marginTop: Spacing.md,
    padding: Spacing.md,
    ...Typography.body,
  },
  cardFooter: {
    alignItems: "center",
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  createdText: {
    color: Colors.light.muted,
    flex: 1,
    ...Typography.label,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.pill,
    flexDirection: "row",
    gap: Spacing.xs,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  cancelText: {
    color: Colors.light.danger,
    ...Typography.label,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
  },
  emptyText: {
    color: Colors.light.muted,
    textAlign: "center",
    ...Typography.body,
  },
  skeletonImage: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 136,
    marginBottom: Spacing.md,
  },
  skeletonLineWide: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.pill,
    height: 18,
    width: "80%",
  },
  skeletonLine: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.pill,
    height: 14,
    marginTop: Spacing.md,
    width: "60%",
  },
  skeletonLineShort: {
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.pill,
    height: 14,
    marginTop: Spacing.sm,
    width: "38%",
  },
});
