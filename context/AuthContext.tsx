import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearStoredToken, getStoredToken, storeToken } from "@/services/authApi";
import type { AuthUser, LoginResponse, UserRole } from "@/types/auth";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: Exclude<UserRole, "admin">;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyTwoFactor: (email: string, challengeToken: string, code: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (accessToken: string, nextUser: AuthUser) => {
    await storeToken(accessToken);
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const nextUser = await authApi.me(token);
    setUser(nextUser);
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });

      if (!response.requires_two_factor) {
        await applySession(response.access_token, response.user);
      }

      return response;
    },
    [applySession],
  );

  const verifyTwoFactor = useCallback(
    async (email: string, challengeToken: string, code: string) => {
      const response = await authApi.verifyTwoFactor({
        email,
        challenge_token: challengeToken,
        code,
      });

      await applySession(response.access_token, response.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await authApi.register(input);
      await applySession(response.access_token, response.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    if (token) {
      await authApi.logout(token).catch(() => null);
    }

    await clearSession();
  }, [clearSession, token]);

  const enableTwoFactor = useCallback(async () => {
    if (!token) {
      return;
    }

    await authApi.enableTwoFactor(token);
    await refreshUser();
  }, [refreshUser, token]);

  const disableTwoFactor = useCallback(async () => {
    if (!token) {
      return;
    }

    await authApi.disableTwoFactor(token);
    await refreshUser();
  }, [refreshUser, token]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const storedToken = await getStoredToken();

      if (!storedToken) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const nextUser = await authApi.me(storedToken);

        if (mounted) {
          setToken(storedToken);
          setUser(nextUser);
        }
      } catch {
        await clearStoredToken();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      verifyTwoFactor,
      register,
      logout,
      refreshUser,
      enableTwoFactor,
      disableTwoFactor,
    }),
    [disableTwoFactor, enableTwoFactor, loading, login, logout, refreshUser, register, token, user, verifyTwoFactor],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
