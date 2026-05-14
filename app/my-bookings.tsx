import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCancelCustomerBooking, useCustomerBookings } from "@/hooks/queries/customer-bookings";
import type { ApiBooking, BookingStatus } from "@/types/rental";

type StatusFilter = "all" | BookingStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_TONE: Record<BookingStatus, { background: string; color: string; label: string }> = {
  pending: { background: Colors.light.warningSoft, color: Colors.light.warning, label: "Pending" },
  confirmed: { background: Colors.light.successSoft, color: Colors.light.success, label: "Confirmed" },
  active: { background: Colors.light.successSoft, color: Colors.light.success, label: "Active" },
  completed: { background: Colors.light.surfaceMuted, color: Colors.light.muted, label: "Completed" },
  cancelled: { background: Colors.light.dangerSoft, color: Colors.light.danger, label: "Cancelled" },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${currency ?? "NPR"} ${n.toFixed(2)}`;
}

function canCancel(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("all");
  const params = useMemo(() => (status === "all" ? {} : { status }), [status]);

  const query = useCustomerBookings(params);
  const cancelBooking = useCancelCustomerBooking();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const bookings = useMemo<ApiBooking[]>(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  if (authLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen>
        <AppHeader eyebrow="Account" title="My bookings" subtitle="Track every booking you've made." icon="receipt-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to see your bookings"
          description="Booking history is tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  function confirmCancel(booking: ApiBooking) {
    Alert.alert(
      "Cancel this booking?",
      `Cancellation may incur a penalty per the listing's rules. Booking ${booking.booking_number} will be cancelled.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            setCancellingId(booking.id);
            try {
              await cancelBooking.mutateAsync({ id: booking.id });
            } catch (exception) {
              Alert.alert("Cancellation failed", exception instanceof Error ? exception.message : "Try again.");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  }

  const error = query.error;

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="My bookings"
        subtitle="Filter by status. Tap a row to see full details."
        icon="receipt-outline"
      />

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const selected = status === item.value;
            return (
              <TouchableOpacity
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                activeOpacity={0.85}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setStatus(item.value)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {error && !bookings.length ? (
        <ErrorState
          title="Couldn't load bookings"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState message="Loading your bookings..." />
      ) : (
        <FlatList
          contentContainerStyle={bookings.length ? styles.list : styles.empty}
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} tintColor={Colors.light.primary} onRefresh={() => query.refetch()} />}
          renderItem={({ item }) => {
            const tone = STATUS_TONE[item.status] ?? STATUS_TONE.pending;
            const cancelBusy = cancellingId === item.id;

            return (
              <TouchableOpacity
                accessibilityLabel={`Open booking ${item.booking_number}`}
                accessibilityRole="button"
                activeOpacity={0.88}
                onPress={() => router.push(`/bookings/${encodeURIComponent(item.booking_number)}` as Href)}
                style={styles.card}
              >
                <View style={styles.topRow}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.bookingNumber} numberOfLines={1}>{item.booking_number}</Text>
                    {item.listing ? (
                      <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
                    <Text style={[styles.statusText, { color: tone.color }]}>{tone.label}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons color={Colors.light.muted} name="calendar-outline" size={14} />
                  <Text style={styles.metaText}>{formatDate(item.start_at)} – {formatDate(item.end_at)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons color={Colors.light.muted} name="cash-outline" size={14} />
                  <Text style={styles.metaText}>{formatMoney(item.total_amount, item.currency)}</Text>
                </View>

                {canCancel(item.status) ? (
                  <TouchableOpacity
                    accessibilityLabel={`Cancel booking ${item.booking_number}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: cancelBusy, busy: cancelBusy }}
                    activeOpacity={0.85}
                    disabled={cancelBusy}
                    onPress={() => confirmCancel(item)}
                    style={styles.cancelButton}
                  >
                    {cancelBusy ? (
                      <ActivityIndicator color={Colors.light.danger} size="small" />
                    ) : (
                      <>
                        <Ionicons color={Colors.light.danger} name="close-circle-outline" size={16} />
                        <Text style={styles.cancelText}>Cancel booking</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.light.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No bookings yet"
              description="When you book a listing, it appears here so you can track its status."
              action={{ label: "Browse listings", icon: "search-outline", onPress: () => router.push("/(tabs)" as Href) }}
            />
          }
        />
      )}

      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.88}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterWrap: {
    paddingVertical: Spacing.md,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  filterChip: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  filterChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  filterTextSelected: {
    color: "white",
  },
  list: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 110,
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  bookingNumber: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  listingTitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.body,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    ...Typography.eyebrow,
    fontWeight: "900",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.light.muted,
    ...Typography.label,
  },
  cancelButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.light.dangerSoft,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  cancelText: {
    color: Colors.light.danger,
    ...Typography.label,
    fontWeight: "900",
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    left: Spacing.xl,
    position: "absolute",
    top: Spacing.xl,
    width: 44,
  },
});
