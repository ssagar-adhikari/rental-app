import { useEffect, useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ApiError } from "@/services/apiClient";
import { listingApi } from "@/services/listingApi";

export default function ListingBySlugScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = (slugParam ?? "").trim();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setError("Listing link is missing a slug.");
      return;
    }

    listingApi
      .showBySlug(slug)
      .then((listing) => {
        if (cancelled) {
          return;
        }

        router.replace(`/service-detail?id=${listing.id}` as Href);
      })
      .catch((exception) => {
        if (cancelled) {
          return;
        }

        setError(exception instanceof ApiError ? exception.message : "Listing not found.");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <Screen>
      {error ? (
        <ErrorState
          description={error}
          onRetry={() => router.replace("/(tabs)" as Href)}
          retryLabel="Back to home"
          title="Listing unavailable"
        />
      ) : (
        <LoadingState message="Opening listing..." />
      )}
    </Screen>
  );
}
