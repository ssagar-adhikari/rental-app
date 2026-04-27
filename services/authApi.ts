import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import type { ApiEnvelope, AuthPayload, AuthUser, LoginResponse, UserRole } from "@/types/auth";

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri?.split(":")[0];

    if (host) {
      return `http://${host}:8000/api`;
    }

    if (Platform.OS === "android") {
      return "http://10.0.2.2:8000/api";
    }
  }

  return "http://127.0.0.1:8000/api";
}

const API_URL = resolveApiUrl();
const TOKEN_KEY = "rental_marketplace_auth_token";

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(`Cannot connect to API at ${API_URL}. Make sure Laravel is running on your LAN IP and port 8000.`, 0);
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

export const authApi = {
  register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: Exclude<UserRole, "admin">;
  }) {
    return request<AuthPayload>("/register", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  login(payload: { email: string; password: string }) {
    return request<LoginResponse>("/login", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  verifyTwoFactor(payload: { email: string; challenge_token: string; code: string }) {
    return request<AuthPayload & { requires_two_factor: false }>("/2fa/verify", {
      method: "POST",
      body: {
        ...payload,
        device_name: `${Platform.OS} app`,
      },
    });
  },

  me(token: string) {
    return request<AuthUser>("/user", { token });
  },

  logout(token: string) {
    return request<null>("/logout", { method: "POST", token });
  },

  forgotPassword(email: string) {
    return request<null>("/password/forgot", {
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
    return request<null>("/password/reset", {
      method: "POST",
      body: payload,
    });
  },

  enableTwoFactor(token: string) {
    return request<null>("/2fa/enable", { method: "POST", token });
  },

  disableTwoFactor(token: string) {
    return request<null>("/2fa/disable", { method: "POST", token });
  },
};
