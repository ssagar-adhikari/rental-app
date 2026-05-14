import { apiRequest } from "@/services/apiClient";

export type DeviceSession = {
  id: number;
  device_name: string | null;
  ip_address: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

export const deviceApi = {
  list(token: string) {
    return apiRequest<DeviceSession[]>("/devices", { token });
  },

  revoke(id: number, token: string) {
    return apiRequest<null>(`/devices/${id}`, { method: "DELETE", token });
  },
};
