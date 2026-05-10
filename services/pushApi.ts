import { apiRequest } from "@/services/apiClient";

export type PushTokenPayload = {
  token: string;
  provider?: "expo" | "fcm" | "apns";
  platform?: "ios" | "android" | "web";
  device_name?: string;
  preferences?: {
    bookings?: boolean;
    inbox?: boolean;
    marketing?: boolean;
  };
};

export type RegisteredPushToken = {
  id: number;
  token: string;
  provider: string;
  platform: string | null;
  preferences: Record<string, unknown> | null;
  is_active: boolean;
};

export const pushApi = {
  register(payload: PushTokenPayload, token: string) {
    return apiRequest<RegisteredPushToken>("/devices/push-token", {
      method: "POST",
      body: payload,
      token,
    });
  },

  unregister(pushToken: string, token: string) {
    return apiRequest<null>("/devices/push-token", {
      method: "DELETE",
      body: { token: pushToken },
      token,
    });
  },
};
