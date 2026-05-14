import { apiRequest } from "@/services/authApi";
import type { ApiBooking } from "@/types/rental";

export type BookingQueryParams = {
  page?: number;
  per_page?: number;
  status?: string;
};

export type PaginatedBookings = {
  data: ApiBooking[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  links?: {
    next?: string | null;
    prev?: string | null;
  };
};

function buildBookingQuery(params: BookingQueryParams = {}) {
  const query = Object.entries(params)
    .flatMap(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        return [];
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");

  return query ? `?${query}` : "";
}

export type CreateBookingBody = {
  listing_id: number;
  rentable_unit_id?: number | null;
  start_at: string;
  end_at: string;
  quantity?: number;
  guest_count?: number;
  notes?: string | null;
};

export const bookingApi = {
  vendorBookings(token: string, params: BookingQueryParams = {}) {
    return apiRequest<PaginatedBookings>(`/vendor/bookings${buildBookingQuery({ per_page: 20, ...params })}`, { token });
  },

  showVendorBooking(id: number, token: string) {
    return apiRequest<ApiBooking>(`/vendor/bookings/${id}`, { token });
  },

  cancelVendorBooking(id: number, token: string, reason = "Cancelled by vendor") {
    return apiRequest<ApiBooking>(`/vendor/bookings/${id}/cancel`, {
      method: "POST",
      body: { reason },
      token,
    });
  },

  showByNumber(bookingNumber: string, token: string) {
    return apiRequest<ApiBooking>(`/bookings/by-number/${encodeURIComponent(bookingNumber)}`, { token });
  },

  createCustomerBooking(body: CreateBookingBody, token: string) {
    return apiRequest<ApiBooking>("/customer/bookings", {
      method: "POST",
      body,
      token,
    });
  },
};
