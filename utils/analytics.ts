import { addBreadcrumb } from "@/utils/sentry";

export const AnalyticsEvents = {
  AuthLoginAttempt: "auth.login.attempt",
  AuthLoginSuccess: "auth.login.success",
  AuthLoginFailure: "auth.login.failure",
  AuthTwoFactorChallenge: "auth.2fa.challenge",
  AuthTwoFactorSuccess: "auth.2fa.success",
  AuthTwoFactorFailure: "auth.2fa.failure",
  AuthRegisterAttempt: "auth.register.attempt",
  AuthRegisterSuccess: "auth.register.success",
  AuthRegisterFailure: "auth.register.failure",
  AuthLogout: "auth.logout",

  SearchPerformed: "search.performed",
  SearchFilterApplied: "search.filter.applied",
  SearchResultClicked: "search.result.clicked",

  ListingViewed: "listing.viewed",
  ListingFavorited: "listing.favorited",
  ListingShared: "listing.shared",

  BookingStarted: "booking.started",
  BookingQuoteRequested: "booking.quote.requested",
  BookingSubmitted: "booking.submitted",
  BookingConfirmed: "booking.confirmed",
  BookingCancelled: "booking.cancelled",
  BookingPaid: "booking.paid",

  ErrorReported: "error.reported",
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsProvider = {
  identify(userId: string | null, traits?: AnalyticsProperties): void;
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
  reset(): void;
};

const noopProvider: AnalyticsProvider = {
  identify() {},
  track() {},
  reset() {},
};

const consoleProvider: AnalyticsProvider = {
  identify(userId, traits) {
    console.info("[analytics] identify", userId, traits ?? {});
  },
  track(event, properties) {
    console.info("[analytics] track", event, properties ?? {});
  },
  reset() {
    console.info("[analytics] reset");
  },
};

let provider: AnalyticsProvider = __DEV__ ? consoleProvider : noopProvider;

export function configureAnalytics(next: AnalyticsProvider): void {
  provider = next;
}

function compactProperties(properties?: AnalyticsProperties) {
  if (!properties) {
    return undefined;
  }

  const entries = Object.entries(properties).filter(([, value]) => value !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export const analytics = {
  identify(userId: string | null, traits?: AnalyticsProperties) {
    provider.identify(userId, compactProperties(traits));
  },

  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    const cleaned = compactProperties(properties);
    provider.track(event, cleaned);
    addBreadcrumb("analytics", event, cleaned);
  },

  reset() {
    provider.reset();
  },
};
