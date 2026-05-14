import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { favoriteApi, type PaginatedFavorites } from "@/services/favoriteApi";

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: (userId?: number) => [...favoriteKeys.all, "list", userId] as const,
};

export function useFavorites() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: favoriteKeys.list(user?.id),
    queryFn: () => favoriteApi.list(token!, { per_page: 100 }),
    enabled: !!token,
  });
}

/**
 * Set of listing ids the current user has favorited.
 *
 * Fetched once via useFavorites and memoized so card grids can do an O(1)
 * lookup per row. Optimistic toggle (see useToggleFavorite) writes through
 * the underlying list query so the membership flips instantly.
 */
export function useFavoriteIds(): Set<number> {
  const { data } = useFavorites();

  return useMemo(() => new Set((data?.data ?? []).map((listing) => listing.id)), [data]);
}

export function useToggleFavorite() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const key = favoriteKeys.list(user?.id);

  return useMutation({
    mutationFn: async ({ listingId, currentlyFavorited }: { listingId: number; currentlyFavorited: boolean }) => {
      if (!token) {
        throw new Error("Sign in to save favorites.");
      }
      if (currentlyFavorited) {
        await favoriteApi.remove(listingId, token);
      } else {
        await favoriteApi.add(listingId, token);
      }
    },
    onMutate: async ({ listingId, currentlyFavorited }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaginatedFavorites>(key);

      if (previous) {
        if (currentlyFavorited) {
          queryClient.setQueryData<PaginatedFavorites>(key, {
            ...previous,
            data: previous.data.filter((listing) => listing.id !== listingId),
            meta: { ...previous.meta, total: Math.max(0, previous.meta.total - 1) },
          });
        }
        // On add, we don't have the full listing payload to splice in.
        // onSettled invalidates so the truth lands after the round trip.
      }

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
