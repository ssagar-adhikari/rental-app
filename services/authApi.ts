import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ApiEnvelope, AuthPayload, AuthUser, LoginResponse, UserRole } from "@/types/auth";

function resolveApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_URL. Add it to your .env file and restart Expo.");
  }

  return apiUrl.replace(/\/+$/, "");
}

const API_URL = resolveApiUrl();
const TOKEN_KEY = "rental_marketplace_auth_token";
const ACTIVE_ROLE_KEY = "rental_marketplace_active_role";
const REQUEST_TIMEOUT_MS = 15000;
type AppRole = Exclude<UserRole, "admin">;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    const detail = timedOut ? "The request timed out." : "The network request failed.";

    throw new ApiError(`${detail} Cannot connect to API at ${API_URL}. Make sure Laravel is reachable from this device.`, 0);
  } finally {
    clearTimeout(timeout);
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !json?.success) {
    const firstError = json?.errors ? Object.values(json.errors).flat()[0] : null;

    throw new ApiError(firstError ?? json?.message ?? "Request failed.", response.status, json?.errors ?? {});
  }

  return json.data;
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredActiveRole(): Promise<AppRole | null> {
  const value =
    Platform.OS === "web"
      ? typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(ACTIVE_ROLE_KEY)
      : await SecureStore.getItemAsync(ACTIVE_ROLE_KEY);

  return value === "customer" || value === "vendor" ? value : null;
}

export async function storeActiveRole(role: AppRole): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return;
  }

  await SecureStore.setItemAsync(ACTIVE_ROLE_KEY, role);
}

export async function clearStoredActiveRole(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACTIVE_ROLE_KEY);
}

export const authApi = {
  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: Exclude<UserRole, "admin">[];
    latitude: number;
    longitude: number;
  }) {
    return apiRequest<AuthPayload>("/register", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  addRole(role: Exclude<UserRole, "admin">, token: string) {
    return apiRequest<AuthUser>(`/roles/${role}`, { method: "POST", token });
  },

  login(payload: { email: string; password: string }) {
    return apiRequest<LoginResponse>("/login", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  verifyTwoFactor(payload: { email: string; challenge_token: string; code: string }) {
    return apiRequest<AuthPayload & { requires_two_factor: false }>("/2fa/verify", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  me(token: string) {
    return apiRequest<AuthUser>("/user", { token });
  },

  logout(token: string) {
    return apiRequest<null>("/logout", { method: "POST", token });
  },

  forgotPassword(email: string) {
    return apiRequest<null>("/password/forgot", {
      method: "POST",
      body: { email },
    });
  },

  resetPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiRequest<null>("/password/reset", {
      method: "POST",
      body: payload,
    });
  },

  enableTwoFactor(token: string) {
    return apiRequest<null>("/2fa/enable", { method: "POST", token });
  },

  disableTwoFactor(token: string) {
    return apiRequest<null>("/2fa/disable", { method: "POST", token });
  },
};
