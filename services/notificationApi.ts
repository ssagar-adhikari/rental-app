import { apiRequest } from "@/services/apiClient";

export type NotificationData = {
  type?: string;
  title?: string;
  body?: string;
  path?: string;
  // Plus any payload-specific keys: booking_id, conversation_id, etc.
  [key: string]: unknown;
};

export type AppNotification = {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
};

export type PaginatedNotifications = {
  data: AppNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_total: number;
  };
};

export const notificationApi = {
  list(token: string, params: { page?: number; unread_only?: boolean } = {}) {
    const query: string[] = [];
    if (params.page) query.push(`page=${params.page}`);
    if (params.unread_only) query.push("unread_only=1");
    const suffix = query.length ? `?${query.join("&")}` : "";

    return apiRequest<PaginatedNotifications>(`/notifications${suffix}`, { token });
  },

  markRead(id: string, token: string) {
    return apiRequest<AppNotification>(`/notifications/${id}/read`, { method: "POST", token });
  },

  markAllRead(token: string) {
    return apiRequest<null>("/notifications/read-all", { method: "POST", token });
  },
};
