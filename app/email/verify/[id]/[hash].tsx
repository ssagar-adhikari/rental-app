import { useEffect, useState } from "react";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ApiError, authApi } from "@/services/authApi";

type Status = "pending" | "success" | "error";

export default function EmailVerifyScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    hash?: string;
    signature?: string;
    expires?: string;
  }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const hash = Array.isArray(params.hash) ? params.hash[0] : params.hash;
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!id || !hash) {
      setStatus("error");
      setMessage("This verification link is incomplete.");
      return;
    }

    const search = Object.entries(params)
      .filter(([key]) => key !== "id" && key !== "hash")
      .flatMap(([key, value]) => {
        if (value == null) {
          return [];
        }

        const values = Array.isArray(value) ? value : [value];
        return values.map((entry) => `${encodeURIComponent(key)}=${encodeURIComponent(entry)}`);
      })
      .join("&");

    authApi
      .verifyEmail(id, hash, search)
      .then(() => {
        if (cancelled) {
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified.");
      })
      .catch((exception) => {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          exception instanceof ApiError
            ? exception.message
            : "We couldn't verify this link. Request a new verification email.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [hash, id, params]);

  if (status === "pending") {
    return (
      <Screen>
        <LoadingState message="Verifying email..." />
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen>
        <ErrorState
          description={message ?? "Verification failed."}
          onRetry={() => router.replace("/login" as Href)}
          retryLabel="Back to login"
          title="Verification link is invalid"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <EmptyState
        action={{ label: "Continue", icon: "arrow-forward", onPress: () => router.replace("/(tabs)" as Href) }}
        description={message ?? "Your account is now verified."}
        icon="checkmark-circle-outline"
        iconBackground="#EAF8F0"
        iconColor="#1B9A5A"
        title="Email verified"
      />
    </Screen>
  );
}
