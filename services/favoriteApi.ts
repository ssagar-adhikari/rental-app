import { apiRequest } from "@/services/apiClient";
import type { ApiListing } from "@/types/rental";

export type FavoritesQueryParams = {
  page?: number;
  per_page?: number;
};

export type PaginatedFavorites = {
  data: ApiListing[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

function buildQuery(params: FavoritesQueryParams = {}): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);

  if (entries.length === 0) {
    return "";
  }

  return "?" + entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&");
}

export const favoriteApi = {
  list(token: string, params: FavoritesQueryParams = {}) {
    return apiRequest<PaginatedFavorites>(`/favorites${buildQuery(params)}`, { token });
  },

  add(listingId: number, token: string) {
    return apiRequest<null>(`/favorites/${listingId}`, { method: "POST", token });
  },

  remove(listingId: number, token: string) {
    return apiRequest<null>(`/favorites/${listingId}`, { method: "DELETE", token });
  },
};
