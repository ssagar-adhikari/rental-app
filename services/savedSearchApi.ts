import { apiRequest } from "@/services/apiClient";

export type SavedSearchFilters = Record<string, unknown>;

export type SavedSearch = {
  id: number;
  name: string;
  filters: SavedSearchFilters;
  notify: boolean;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSavedSearchBody = {
  name: string;
  filters: SavedSearchFilters;
  notify?: boolean;
};

export type UpdateSavedSearchBody = Partial<CreateSavedSearchBody>;

export const savedSearchApi = {
  list(token: string) {
    return apiRequest<SavedSearch[]>("/saved-searches", { token });
  },

  create(body: CreateSavedSearchBody, token: string) {
    return apiRequest<SavedSearch>("/saved-searches", { method: "POST", body, token });
  },

  update(id: number, body: UpdateSavedSearchBody, token: string) {
    return apiRequest<SavedSearch>(`/saved-searches/${id}`, { method: "PATCH", body, token });
  },

  remove(id: number, token: string) {
    return apiRequest<null>(`/saved-searches/${id}`, { method: "DELETE", token });
  },
};
