import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, type CreateBookingBody } from "@/services/bookingApi";
import { listingApi, type QuoteRequestBody, type QuoteResult } from "@/services/listingApi";

const bookingFlowKeys = {
  quote: (listingId: number, body: QuoteRequestBody) => ["booking-flow", "quote", listingId, body] as const,
};

/**
 * Live quote for a (listing, dates, headcount) tuple. Disabled until the
 * caller hands over a valid start/end pair — saves a 422 round-trip during
 * form editing.
 */
export function useListingQuote(listingId: number, body: QuoteRequestBody | null) {
  const enabled = !!body && !!body.start_at && !!body.end_at;

  return useQuery<QuoteResult>({
    queryKey: bookingFlowKeys.quote(listingId, body ?? ({} as QuoteRequestBody)),
    queryFn: () => listingApi.quote(listingId, body!),
    enabled,
    // Quotes can drift if the vendor edits pricing mid-flow. 60s is plenty
    // for a user filling in dates; refresh on focus is overkill.
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateCustomerBooking() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateBookingBody) => {
      if (!token) {
        throw new Error("Sign in to book a listing.");
      }
      return bookingApi.createCustomerBooking(body, token);
    },
    onSuccess: () => {
      // Invalidate any cached booking lists so customer history reflects
      // the new row on next visit. Cheap because no list is mounted today.
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
