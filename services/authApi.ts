import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "@/services/apiClient";
import type { AuthPayload, AuthUser, LoginResponse, UserRole } from "@/types/auth";

export { ApiError, apiRequest } from "@/services/apiClient";
export type { RequestOptions } from "@/services/apiClient";

const TOKEN_KEY = "rental_marketplace_auth_token";
const ACTIVE_ROLE_KEY = "rental_marketplace_active_role";
type AppRole = Exclude<UserRole, "admin">;

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
    return apiRequest<null>("/logout", { method: "POST", token, skipAuthRefresh: true });
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

  resendEmailVerification(token: string) {
    return apiRequest<null>("/email/verification-notification", { method: "POST", token });
  },

  verifyEmail(id: string, hash: string, query: string) {
    const suffix = query ? (query.startsWith("?") ? query : `?${query}`) : "";
    return apiRequest<null>(`/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}${suffix}`);
  },

  enableTwoFactor(token: string) {
    return apiRequest<null>("/2fa/enable", { method: "POST", token });
  },

  disableTwoFactor(token: string) {
    return apiRequest<null>("/2fa/disable", { method: "POST", token });
  },
};
