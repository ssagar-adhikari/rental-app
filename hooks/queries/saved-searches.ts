import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  savedSearchApi,
  type CreateSavedSearchBody,
  type SavedSearch,
  type UpdateSavedSearchBody,
} from "@/services/savedSearchApi";

export const savedSearchKeys = {
  all: ["saved-searches"] as const,
  list: (userId?: number) => [...savedSearchKeys.all, "list", userId] as const,
};

export function useSavedSearches() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: savedSearchKeys.list(user?.id),
    queryFn: () => savedSearchApi.list(token!),
    enabled: !!token,
  });
}

export function useCreateSavedSearch() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSavedSearchBody) => {
      if (!token) {
        throw new Error("Sign in to save searches.");
      }
      return savedSearchApi.create(body, token);
    },
    onSuccess: (created) => {
      // Splice into the cached list so the new row shows immediately
      // without a round trip. List endpoint returns newest first.
      queryClient.setQueryData<SavedSearch[]>(savedSearchKeys.list(user?.id), (current) =>
        current ? [created, ...current] : [created],
      );
    },
  });
}

export function useUpdateSavedSearch() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSavedSearchBody }) => {
      if (!token) {
        throw new Error("Sign in to update saved searches.");
      }
      return savedSearchApi.update(id, body, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SavedSearch[]>(savedSearchKeys.list(user?.id), (current) =>
        current ? current.map((row) => (row.id === updated.id ? updated : row)) : current,
      );
    },
  });
}

export function useDeleteSavedSearch() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      if (!token) {
        throw new Error("Sign in to delete saved searches.");
      }
      return savedSearchApi.remove(id, token);
    },
    onMutate: async (id) => {
      const key = savedSearchKeys.list(user?.id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SavedSearch[]>(key);

      queryClient.setQueryData<SavedSearch[]>(key, (current) =>
        current ? current.filter((row) => row.id !== id) : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(savedSearchKeys.list(user?.id), context.previous);
      }
    },
  });
}
