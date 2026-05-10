import Constants from "expo-constants";

export type AppEnv = "development" | "staging" | "production";

type RawExtra = {
  apiUrl?: string;
  appEnv?: string;
  sentryDsn?: string;
  easProjectId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RawExtra;

function requireString(value: string | undefined, name: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(
      `[config] Missing ${name}. Set it in .env (and reload Expo). See .env.example for the full list.`,
    );
  }

  return trimmed;
}

function normalizeAppEnv(value: string | undefined): AppEnv {
  if (value === "production" || value === "staging") {
    return value;
  }

  return "development";
}

const apiUrl = requireString(extra.apiUrl, "EXPO_PUBLIC_API_URL").replace(/\/+$/, "");

export const Config = {
  apiUrl,
  appEnv: normalizeAppEnv(extra.appEnv),
  sentryDsn: extra.sentryDsn?.trim() || null,
  easProjectId: extra.easProjectId?.trim() || null,
} as const;

export const isProduction = Config.appEnv === "production";
export const isStaging = Config.appEnv === "staging";
export const isDevelopment = Config.appEnv === "development";
