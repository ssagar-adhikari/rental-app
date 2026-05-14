import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, type BookingQueryParams, type PaginatedBookings } from "@/services/bookingApi";

export const customerBookingKeys = {
  all: ["customer-bookings"] as const,
  list: (userId: number | undefined, params: BookingQueryParams) =>
    [...customerBookingKeys.all, "list", userId, params] as const,
};

export function useCustomerBookings(params: BookingQueryParams = {}) {
  const { token, user } = useAuth();

  return useInfiniteQuery({
    queryKey: customerBookingKeys.list(user?.id, params),
    queryFn: ({ pageParam }) => bookingApi.customerBookings(token!, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedBookings) => {
      const current = Number(lastPage.meta?.current_page ?? 1);
      const last = Number(lastPage.meta?.last_page ?? 1);
      return current < last ? current + 1 : undefined;
    },
    enabled: !!token,
  });
}

export function useCancelCustomerBooking() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => {
      if (!token) {
        throw new Error("Sign in to cancel bookings.");
      }
      return bookingApi.cancelCustomerBooking(id, token, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerBookingKeys.all });
      // Also refresh the vendor-side cache + by-number deep link, since
      // the cancellation is visible from there too.
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
