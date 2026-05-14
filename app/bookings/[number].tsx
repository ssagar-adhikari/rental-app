import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/apiClient";
import { bookingApi } from "@/services/bookingApi";
import type { ApiBooking, BookingStatus } from "@/types/rental";

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
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${currency ?? "NPR"} ${n.toFixed(2)}`;
}

export default function BookingByNumberScreen() {
  const params = useLocalSearchParams<{ number?: string | string[] }>();
  const numberParam = Array.isArray(params.number) ? params.number[0] : params.number;
  const bookingNumber = (numberParam ?? "").trim();
  const { token, user, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return;
    }

    if (!bookingNumber) {
      setError("Booking link is missing a number.");
      setLoadingBooking(false);
      return;
    }

    if (!token) {
      router.replace(`/login?next=/bookings/${encodeURIComponent(bookingNumber)}` as Href);
      return;
    }

    setLoadingBooking(true);
    bookingApi
      .showByNumber(bookingNumber, token)
      .then((row) => {
        if (cancelled) return;
        setBooking(row);
        setError(null);
      })
      .catch((exception) => {
        if (cancelled) return;
        setError(exception instanceof ApiError ? exception.message : "Booking not found.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingBooking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingNumber, authLoading, token]);

  if (authLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          description={error}
          onRetry={() => router.replace("/(tabs)" as Href)}
          retryLabel="Back to home"
          title="Booking unavailable"
        />
      </Screen>
    );
  }

  if (loadingBooking || !booking) {
    return (
      <Screen>
        <LoadingState message="Opening booking..." />
      </Screen>
    );
  }

  const isVendor = user?.id === booking.owner_id;
  const tone = STATUS_TONE[booking.status] ?? STATUS_TONE.pending;

  return (
    <Screen>
      <AppHeader
        eyebrow="Booking"
        title={booking.booking_number}
        subtitle={isVendor ? "Booking on one of your listings." : "Your booking request."}
        icon="receipt-outline"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          activeOpacity={0.88}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
        </TouchableOpacity>

        <View style={styles.statusCard}>
          <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
            <Text style={[styles.statusText, { color: tone.color }]}>{tone.label}</Text>
          </View>
          {booking.cancellation_reason ? (
            <Text style={styles.cancellationReason}>Reason: {booking.cancellation_reason}</Text>
          ) : null}
        </View>

        {booking.listing ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Listing</Text>
            <Text style={styles.value}>{booking.listing.title}</Text>
            {booking.listing.summary ? <Text style={styles.help}>{booking.listing.summary}</Text> : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Row label="Check-in" value={formatDate(booking.start_at)} />
          <Row label="Check-out" value={formatDate(booking.end_at)} />
          {booking.guest_count ? <Row label="Guests" value={String(booking.guest_count)} /> : null}
          {booking.quantity ? <Row label="Units" value={String(booking.quantity)} /> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price</Text>
          <Row label="Subtotal" value={formatMoney(booking.subtotal_amount, booking.currency)} />
          {Number(booking.deposit_amount) > 0 ? (
            <Row label="Deposit" value={formatMoney(booking.deposit_amount, booking.currency)} />
          ) : null}
          {Number(booking.penalty_amount) > 0 ? (
            <Row label="Penalty" value={formatMoney(booking.penalty_amount, booking.currency)} />
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatMoney(booking.total_amount, booking.currency)}</Text>
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.value}>{booking.notes}</Text>
          </View>
        ) : null}

        {isVendor ? (
          <TouchableOpacity
            accessibilityLabel="Manage bookings"
            accessibilityRole="button"
            activeOpacity={0.88}
            onPress={() => router.push("/vendor-bookings" as Href)}
            style={styles.primaryButton}
          >
            <Ionicons color="white" name="briefcase-outline" size={19} />
            <Text style={styles.primaryButtonText}>Manage in dashboard</Text>
          </TouchableOpacity>
        ) : null}

        {!isVendor ? (
          <EmptyState
            variant="inline"
            icon="information-circle-outline"
            title="Need to change something?"
            description="Message the vendor or contact support to update or cancel this booking."
            action={{
              label: "Open inbox",
              icon: "chatbubbles-outline",
              onPress: () => router.push("/inbox" as Href),
            }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 80,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    width: 44,
  },
  statusCard: {
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  statusText: {
    ...Typography.label,
    fontWeight: "900",
  },
  cancellationReason: {
    color: Colors.light.muted,
    ...Typography.label,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  value: {
    color: Colors.light.text,
    ...Typography.body,
  },
  help: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.label,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  rowLabel: {
    color: Colors.light.muted,
    ...Typography.body,
  },
  rowValue: {
    color: Colors.light.text,
    flex: 1,
    textAlign: "right",
    ...Typography.bodyStrong,
  },
  totalRow: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  totalAmount: {
    color: Colors.light.primary,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    minHeight: 54,
  },
  primaryButtonText: {
    color: "white",
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
});
