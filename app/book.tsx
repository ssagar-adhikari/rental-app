import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Stepper } from "@/components/Stepper";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useListings } from "@/context/ListingsContext";
import { useCreateCustomerBooking, useListingQuote } from "@/hooks/queries/booking-flow";
import type { QuoteRequestBody } from "@/services/listingApi";

function defaultDateTime(daysFromNow: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);

  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isValidIso(input: string): boolean {
  // Accept "YYYY-MM-DDTHH:mm" with optional seconds. Parse confirms it's a real instant.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(input)) {
    return false;
  }
  const date = new Date(input);
  return !Number.isNaN(date.getTime());
}

export default function BookScreen() {
  const params = useLocalSearchParams<{ listingId?: string | string[] }>();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { listings, loadListing } = useListings();

  const listingId = useMemo(() => {
    const raw = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.listingId]);

  const listing = listingId ? listings.find((item) => item.id === listingId) : undefined;
  const [startAt, setStartAt] = useState<string>(() => defaultDateTime(1, 10));
  const [endAt, setEndAt] = useState<string>(() => defaultDateTime(2, 10));
  const [quantity, setQuantity] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookedNumber, setBookedNumber] = useState<string | null>(null);

  const startValid = isValidIso(startAt);
  const endValid = isValidIso(endAt);
  const datesOrdered = startValid && endValid && new Date(endAt) > new Date(startAt);
  const datesValid = startValid && endValid && datesOrdered;

  const quoteBody = useMemo<QuoteRequestBody | null>(
    () =>
      datesValid && listingId
        ? { start_at: startAt, end_at: endAt, quantity, guest_count: guestCount }
        : null,
    [datesValid, listingId, startAt, endAt, quantity, guestCount],
  );

  const quoteQuery = useListingQuote(listingId ?? 0, listingId ? quoteBody : null);
  const createBooking = useCreateCustomerBooking();

  // Pull listing into context cache if it isn't there yet (deep link, fresh app).
  if (listingId && !listing) {
    loadListing(listingId).catch(() => null);
  }

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
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to book"
          description="Log in to your account to request this listing."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.replace("/login" as Href) }}
        />
      </Screen>
    );
  }

  if (!listingId) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Listing not specified"
          description="This booking link is missing the listing it refers to."
          action={{ label: "Browse listings", onPress: () => router.replace("/(tabs)" as Href) }}
        />
      </Screen>
    );
  }

  function setStartDate(value: string) {
    setStartAt(value);
    setSubmitError(null);
  }

  function setEndDate(value: string) {
    setEndAt(value);
    setSubmitError(null);
  }

  async function submit() {
    if (!datesValid) {
      setSubmitError("Pick valid start and end dates (YYYY-MM-DDTHH:mm).");
      return;
    }

    if (!quoteQuery.data) {
      setSubmitError("Wait for the price quote to load before booking.");
      return;
    }

    setSubmitError(null);

    try {
      const booking = await createBooking.mutateAsync({
        listing_id: listingId!,
        start_at: startAt,
        end_at: endAt,
        quantity,
        guest_count: guestCount,
        notes: notes.trim() ? notes.trim() : null,
      });

      setBookedNumber(booking.booking_number);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create booking.");
    }
  }

  const quote = quoteQuery.data;
  const quoteError = quoteQuery.error instanceof Error ? quoteQuery.error.message : null;

  if (bookedNumber) {
    return (
      <Screen>
        <AppHeader
          eyebrow="Booking"
          title="Request sent"
          subtitle="The vendor will review and confirm. You'll get an email when they respond."
          icon="checkmark-circle-outline"
        />
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons color={Colors.light.success} name="checkmark" size={32} />
          </View>
          <Text style={styles.successTitle}>Booking submitted</Text>
          <Text style={styles.successNumber}>{bookedNumber}</Text>
          <Text style={styles.help}>Reference this number when you contact the vendor.</Text>

          <TouchableOpacity
            accessibilityLabel="Back to home"
            accessibilityRole="button"
            activeOpacity={0.88}
            onPress={() => router.replace("/(tabs)" as Href)}
            style={styles.successButton}
          >
            <Ionicons color="white" name="home-outline" size={19} />
            <Text style={styles.submitText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <AppHeader
          eyebrow="Booking"
          title={listing?.title ?? "Request booking"}
          subtitle="Pick your dates and confirm the price before sending the request."
          icon="calendar-number-outline"
        />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.88}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>When?</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Check-in</Text>
              <TextInput
                accessibilityLabel="Check-in date and time"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DDTHH:mm"
                placeholderTextColor={Colors.light.muted}
                style={[styles.input, !startValid && startAt ? styles.inputError : null]}
                value={startAt}
              />
              {!startValid && startAt ? <Text style={styles.fieldError}>Use format 2026-05-20T10:00</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Check-out</Text>
              <TextInput
                accessibilityLabel="Check-out date and time"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DDTHH:mm"
                placeholderTextColor={Colors.light.muted}
                style={[styles.input, (!endValid && endAt) || (datesValid === false && endValid && startValid) ? styles.inputError : null]}
                value={endAt}
              />
              {!endValid && endAt ? <Text style={styles.fieldError}>Use format 2026-05-20T10:00</Text> : null}
              {startValid && endValid && !datesOrdered ? (
                <Text style={styles.fieldError}>Check-out must be after check-in.</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.sectionTitle}>Units</Text>
                <Text style={styles.help}>How many of this listing you&apos;re booking.</Text>
              </View>
              <Stepper accessibilityLabel="Quantity" max={20} min={1} onChange={setQuantity} value={quantity} />
            </View>

            <View style={[styles.row, styles.rowSpacing]}>
              <View style={styles.rowText}>
                <Text style={styles.sectionTitle}>Guests</Text>
                <Text style={styles.help}>People staying / using the booking.</Text>
              </View>
              <Stepper accessibilityLabel="Guest count" max={20} min={1} onChange={setGuestCount} value={guestCount} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              accessibilityLabel="Notes for the vendor"
              multiline
              numberOfLines={4}
              onChangeText={setNotes}
              placeholder="Anything the vendor should know — arrival time, accessibility needs, etc."
              placeholderTextColor={Colors.light.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={notes}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Price</Text>

            {!datesValid ? (
              <Text style={styles.help}>Fill in valid dates above to see a price quote.</Text>
            ) : quoteQuery.isPending ? (
              <View style={styles.quoteLoading}>
                <ActivityIndicator color={Colors.light.primary} />
                <Text style={styles.help}>Fetching latest price...</Text>
              </View>
            ) : quoteError ? (
              <Text style={styles.fieldError}>{quoteError}</Text>
            ) : quote ? (
              <View>
                {quote.lines.map((line, index) => (
                  <View key={`${line.pricing_rule_id}-${index}`} style={styles.lineRow}>
                    <Text style={styles.lineLabel} numberOfLines={1}>
                      {line.label}
                    </Text>
                    <Text style={styles.lineAmount}>{quote.currency} {line.amount.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{quote.currency} {quote.total_amount.toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {submitError ? <Text style={[styles.fieldError, styles.submitError]}>{submitError}</Text> : null}

          <TouchableOpacity
            accessibilityLabel="Confirm booking"
            accessibilityRole="button"
            accessibilityState={{ disabled: !datesValid || !quote || createBooking.isPending, busy: createBooking.isPending }}
            activeOpacity={0.88}
            disabled={!datesValid || !quote || createBooking.isPending}
            onPress={submit}
            style={[styles.submitButton, (!datesValid || !quote || createBooking.isPending) && styles.submitDisabled]}
          >
            {createBooking.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons color="white" name="send-outline" size={19} />
                <Text style={styles.submitText}>Confirm booking</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  help: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.label,
  },
  field: {
    marginTop: Spacing.lg,
  },
  label: {
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    ...Typography.label,
    fontWeight: "900",
  },
  input: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.light.text,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    fontWeight: "700",
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  textArea: {
    marginTop: Spacing.md,
    minHeight: 96,
    paddingVertical: Spacing.md,
  },
  fieldError: {
    color: Colors.light.danger,
    marginTop: Spacing.xs,
    ...Typography.label,
  },
  submitError: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  rowSpacing: {
    marginTop: Spacing.lg,
  },
  rowText: {
    flex: 1,
  },
  quoteLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  lineRow: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  lineLabel: {
    color: Colors.light.muted,
    flex: 1,
    ...Typography.body,
  },
  lineAmount: {
    color: Colors.light.text,
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
  submitButton: {
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
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: "white",
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  successCard: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
  },
  successIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.successSoft,
    borderRadius: Radius.pill,
    height: 64,
    justifyContent: "center",
    marginBottom: Spacing.md,
    width: 64,
  },
  successTitle: {
    color: Colors.light.text,
    ...Typography.sectionTitle,
  },
  successNumber: {
    color: Colors.light.primary,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  successButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    marginTop: Spacing.xl,
    minHeight: 54,
    paddingHorizontal: Spacing.xl,
  },
});
