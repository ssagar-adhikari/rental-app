import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  notificationApi,
  type AppNotification,
  type PaginatedNotifications,
} from "@/services/notificationApi";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId?: number) => [...notificationKeys.all, "list", userId] as const,
};

export function useNotifications() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.list(user?.id),
    queryFn: () => notificationApi.list(token!),
    enabled: !!token,
    // Same cadence as the inbox — close enough to feel live for an
    // in-app surface, light enough to skip when the screen isn't open.
    refetchInterval: 30_000,
  });
}

/**
 * Convenience selector for a notification-bell badge. Returns the live
 * unread_total from the most recent fetch, or undefined while loading.
 */
export function useUnreadNotificationCount(): number | undefined {
  const { data } = useNotifications();
  return data?.meta.unread_total;
}

export function useMarkNotificationRead() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const key = notificationKeys.list(user?.id);

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) {
        throw new Error("Sign in to mark notifications as read.");
      }
      return notificationApi.markRead(id, token);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaginatedNotifications>(key);

      queryClient.setQueryData<PaginatedNotifications>(key, (current) => {
        if (!current) return current;
        let unreadDelta = 0;
        const data = current.data.map<AppNotification>((row) => {
          if (row.id === id && !row.read_at) {
            unreadDelta = 1;
            return { ...row, read_at: new Date().toISOString() };
          }
          return row;
        });
        return {
          ...current,
          data,
          meta: { ...current.meta, unread_total: Math.max(0, current.meta.unread_total - unreadDelta) },
        };
      });

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const key = notificationKeys.list(user?.id);

  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Sign in to mark notifications as read.");
      }
      return notificationApi.markAllRead(token);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaginatedNotifications>(key);

      queryClient.setQueryData<PaginatedNotifications>(key, (current) => {
        if (!current) return current;
        const stamp = new Date().toISOString();
        return {
          ...current,
          data: current.data.map((row) => (row.read_at ? row : { ...row, read_at: stamp })),
          meta: { ...current.meta, unread_total: 0 },
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
