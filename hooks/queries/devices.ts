import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { deviceApi, type DeviceSession } from "@/services/deviceApi";

export const deviceKeys = {
  all: ["devices"] as const,
  list: (userId?: number) => [...deviceKeys.all, "list", userId] as const,
};

export function useDevices() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: deviceKeys.list(user?.id),
    queryFn: () => deviceApi.list(token!),
    enabled: !!token,
  });
}

export function useRevokeDevice() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const key = deviceKeys.list(user?.id);

  return useMutation({
    mutationFn: (id: number) => {
      if (!token) {
        throw new Error("Sign in to manage devices.");
      }
      return deviceApi.revoke(id, token);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DeviceSession[]>(key);

      // Optimistic: stamp revoked_at locally so the row dims immediately.
      queryClient.setQueryData<DeviceSession[]>(key, (current) =>
        current
          ? current.map((row) => (row.id === id ? { ...row, revoked_at: new Date().toISOString() } : row))
          : current,
      );

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
