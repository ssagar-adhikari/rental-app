import * as Sentry from "@sentry/react-native";
import { Config, isProduction } from "@/constants/config";

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  if (!Config.sentryDsn) {
    if (__DEV__) {
      console.info("[sentry] Skipped init: EXPO_PUBLIC_SENTRY_DSN not set.");
    }
    return;
  }

  Sentry.init({
    dsn: Config.sentryDsn,
    environment: Config.appEnv,
    enabled: !__DEV__,
    sendDefaultPii: false,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    attachStacktrace: true,
  });

  initialized = true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

export function captureException(error: unknown, context?: ErrorContext): void {
  if (!initialized) {
    return;
  }

  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}

export function setSentryUser(user: { id: string | number; roles?: string[] } | null): void {
  if (!initialized) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: String(user.id),
    roles: user.roles,
  });
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}
