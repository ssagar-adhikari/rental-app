import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  authApi,
  clearStoredActiveRole,
  clearStoredToken,
  getStoredActiveRole,
  getStoredToken,
  storeActiveRole,
  storeToken,
} from "@/services/authApi";
import type { AuthUser, LoginResponse, UserRole } from "@/types/auth";
import { canUseRole, getAvailableAppRoles, type AppRole } from "@/utils/authRoutes";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles: Exclude<UserRole, "admin">[];
  latitude: number;
  longitude: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  activeRole: AppRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyTwoFactor: (email: string, challengeToken: string, code: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  addRole: (role: AppRole) => Promise<AuthUser | null>;
  selectRole: (role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const rememberRoleForUser = useCallback(
    async (nextUser: AuthUser, preferredRole: AppRole | null = activeRole) => {
      const availableRoles = getAvailableAppRoles(nextUser);
      const nextRole = canUseRole(nextUser, preferredRole) ? preferredRole : availableRoles.length === 1 ? availableRoles[0] : null;

      if (nextRole) {
        await storeActiveRole(nextRole);
      } else {
        await clearStoredActiveRole();
      }

      setActiveRole(nextRole);
      return nextRole;
    },
    [activeRole],
  );

  const applySession = useCallback(
    async (accessToken: string, nextUser: AuthUser) => {
      await storeToken(accessToken);
      setToken(accessToken);
      setUser(nextUser);
      await rememberRoleForUser(nextUser);
    },
    [rememberRoleForUser],
  );

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
    await rememberRoleForUser(nextUser);
  }, [rememberRoleForUser, token]);

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
      return response.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await authApi.register(input);
      await applySession(response.access_token, response.user);
      return response.user;
    },
    [applySession],
  );

  const addRole = useCallback(
    async (role: AppRole) => {
      if (!token) {
        return null;
      }

      const nextUser = await authApi.addRole(role, token);
      setUser(nextUser);
      await rememberRoleForUser(nextUser, role);
      return nextUser;
    },
    [rememberRoleForUser, token],
  );

  const selectRole = useCallback(
    async (role: AppRole) => {
      if (!user || !canUseRole(user, role)) {
        return;
      }

      await storeActiveRole(role);
      setActiveRole(role);
    },
    [user],
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
      const storedActiveRole = await getStoredActiveRole();
      setActiveRole(storedActiveRole);

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
          await rememberRoleForUser(nextUser, storedActiveRole);
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
      activeRole,
      loading,
      login,
      verifyTwoFactor,
      register,
      addRole,
      selectRole,
      logout,
      refreshUser,
      enableTwoFactor,
      disableTwoFactor,
    }),
    [
      activeRole,
      addRole,
      disableTwoFactor,
      enableTwoFactor,
      loading,
      login,
      logout,
      refreshUser,
      register,
      selectRole,
      token,
      user,
      verifyTwoFactor,
    ],
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
