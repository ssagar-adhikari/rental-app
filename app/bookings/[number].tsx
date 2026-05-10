import { useEffect, useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/apiClient";
import { bookingApi } from "@/services/bookingApi";

export default function BookingByNumberScreen() {
  const params = useLocalSearchParams<{ number?: string | string[] }>();
  const numberParam = Array.isArray(params.number) ? params.number[0] : params.number;
  const bookingNumber = (numberParam ?? "").trim();
  const { token, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (loading) {
      return;
    }

    if (!bookingNumber) {
      setError("Booking link is missing a number.");
      return;
    }

    if (!token) {
      router.replace(`/login?next=/bookings/${encodeURIComponent(bookingNumber)}` as Href);
      return;
    }

    bookingApi
      .showByNumber(bookingNumber, token)
      .then((booking) => {
        if (cancelled) {
          return;
        }

        const target = `/vendor-bookings?id=${booking.id}` as Href;
        router.replace(target);
      })
      .catch((exception) => {
        if (cancelled) {
          return;
        }

        setError(exception instanceof ApiError ? exception.message : "Booking not found.");
      });

    return () => {
      cancelled = true;
    };
  }, [bookingNumber, loading, token]);

  return (
    <Screen>
      {error ? (
        <ErrorState
          description={error}
          onRetry={() => router.replace("/(tabs)" as Href)}
          retryLabel="Back to home"
          title="Booking unavailable"
        />
      ) : (
        <LoadingState message="Opening booking..." />
      )}
    </Screen>
  );
}
