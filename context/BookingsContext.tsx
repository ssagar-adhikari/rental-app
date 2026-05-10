import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, type BookingQueryParams, type PaginatedBookings } from "@/services/bookingApi";
import type { ApiBooking, BookingStatusCounts } from "@/types/rental";

type BookingMetrics = BookingStatusCounts & {
  expectedRevenue: number;
  currency: string;
};

type BookingsContextValue = {
  vendorBookings: ApiBooking[];
  vendorBookingsLoading: boolean;
  vendorBookingsRefreshing: boolean;
  vendorBookingsLoadingMore: boolean;
  vendorBookingsError: string | null;
  hasMoreVendorBookings: boolean;
  bookingMetrics: BookingMetrics;
  refreshVendorBookings: (params?: BookingQueryParams) => Promise<void>;
  loadMoreVendorBookings: () => Promise<void>;
  loadVendorBooking: (id: number) => Promise<ApiBooking>;
  cancelVendorBooking: (id: number, reason?: string) => Promise<ApiBooking>;
};

const BookingsContext = createContext<BookingsContextValue | null>(null);

export const vendorBookingsListKey = ["bookings", "vendor", "list"] as const;
export const vendorBookingByIdKey = (id: number) => ["bookings", "vendor", "by-id", id] as const;

const defaultParams: BookingQueryParams = { per_page: 20 };

function normalizeAmount(value: number | string | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function buildMetrics(bookings: ApiBooking[]): BookingMetrics {
  return bookings.reduce<BookingMetrics>(
    (metrics, booking) => {
      metrics.total += 1;

      if (booking.status === "pending") metrics.pending += 1;
      if (booking.status === "confirmed") metrics.confirmed += 1;
      if (booking.status === "active") metrics.active += 1;
      if (booking.status === "completed") metrics.completed += 1;
      if (booking.status === "cancelled") metrics.cancelled += 1;

      if (booking.status !== "cancelled") {
        metrics.expectedRevenue += normalizeAmount(booking.total_amount);
      }

      if (booking.currency) {
        metrics.currency = booking.currency;
      }

      return metrics;
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      expectedRevenue: 0,
      currency: "NPR",
    },
  );
}

export function BookingsProvider({ children }: PropsWithChildren) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BookingQueryParams>(defaultParams);

  const isVendor = !!token && !!user?.roles.includes("vendor");

  const query = useInfiniteQuery({
    queryKey: [...vendorBookingsListKey, params] as const,
    queryFn: ({ pageParam }) => bookingApi.vendorBookings(token!, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedBookings) => {
      const current = Number(lastPage.meta?.current_page ?? 1);
      const last = Number(lastPage.meta?.last_page ?? 1);
      return current < last ? current + 1 : undefined;
    },
    enabled: isVendor,
  });

  const vendorBookings = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const refreshVendorBookings = useCallback(
    async (next?: BookingQueryParams) => {
      if (!isVendor) {
        return;
      }

      if (next && Object.keys(next).length > 0) {
        setParams((current) => ({ ...defaultParams, ...current, ...next }));
        return;
      }

      await query.refetch();
    },
    [isVendor, query],
  );

  const loadMoreVendorBookings = useCallback(async () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      await query.fetchNextPage();
    }
  }, [query]);

  const loadVendorBooking = useCallback(
    async (id: number) => {
      if (!token) {
        throw new Error("Please log in as a vendor to view bookings.");
      }

      const booking = await queryClient.fetchQuery({
        queryKey: vendorBookingByIdKey(id),
        queryFn: () => bookingApi.showVendorBooking(id, token),
      });

      queryClient.invalidateQueries({ queryKey: vendorBookingsListKey });

      return booking;
    },
    [queryClient, token],
  );

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => {
      if (!token) {
        throw new Error("Please log in as a vendor to cancel bookings.");
      }

      return bookingApi.cancelVendorBooking(id, token, reason);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorBookingsListKey });
      queryClient.invalidateQueries({ queryKey: vendorBookingByIdKey(variables.id) });
    },
  });

  const cancelVendorBooking = useCallback(
    (id: number, reason = "Cancelled by vendor") => cancelMutation.mutateAsync({ id, reason }),
    [cancelMutation],
  );

  const bookingMetrics = useMemo(() => buildMetrics(vendorBookings), [vendorBookings]);

  const value = useMemo<BookingsContextValue>(
    () => ({
      vendorBookings,
      vendorBookingsLoading: query.isPending && isVendor,
      vendorBookingsRefreshing: query.isRefetching && !query.isFetchingNextPage,
      vendorBookingsLoadingMore: query.isFetchingNextPage,
      vendorBookingsError: query.error instanceof Error ? query.error.message : null,
      hasMoreVendorBookings: query.hasNextPage ?? false,
      bookingMetrics,
      refreshVendorBookings,
      loadMoreVendorBookings,
      loadVendorBooking,
      cancelVendorBooking,
    }),
    [
      bookingMetrics,
      cancelVendorBooking,
      isVendor,
      loadMoreVendorBookings,
      loadVendorBooking,
      query.error,
      query.hasNextPage,
      query.isFetchingNextPage,
      query.isPending,
      query.isRefetching,
      refreshVendorBookings,
      vendorBookings,
    ],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingsContext);

  if (!context) {
    throw new Error("useBookings must be used within BookingsProvider");
  }

  return context;
}
