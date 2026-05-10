import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/apiClient";

const FIVE_MINUTES = 5 * 60 * 1000;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
      return false;
    }
  }

  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
});
