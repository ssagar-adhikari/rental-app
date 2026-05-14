import { apiRequest } from "@/services/apiClient";

export type AccountDeletionResponse = {
  id: number;
  status: "pending" | "processed" | "failed" | "cancelled";
};

export const accountApi = {
  requestDeletion(reason: string | null, token: string) {
    return apiRequest<AccountDeletionResponse>("/account/deletion-request", {
      method: "POST",
      body: reason ? { reason } : {},
      token,
    });
  },
};
