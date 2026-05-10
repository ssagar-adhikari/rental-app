import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearApiClientHandlers, configureApiClient } from "@/services/apiClient";
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
import { analytics, AnalyticsEvents } from "@/utils/analytics";
import { canUseRole, getAvailableAppRoles, type AppRole } from "@/utils/authRoutes";
import { syncPushTokenWithBackend, unregisterPushToken } from "@/utils/pushNotifications";
import { setSentryUser } from "@/utils/sentry";

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
  resendEmailVerification: () => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

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
      analytics.identify(String(nextUser.id), { roles: nextUser.roles?.join(",") });
      setSentryUser({ id: nextUser.id, roles: nextUser.roles });

      const pushToken = await syncPushTokenWithBackend(accessToken);
      pushTokenRef.current = pushToken;
    },
    [rememberRoleForUser],
  );

  const clearSession = useCallback(async () => {
    const previousAuthToken = tokenRef.current;
    const previousPushToken = pushTokenRef.current;

    if (previousAuthToken && previousPushToken) {
      await unregisterPushToken(previousPushToken, previousAuthToken);
    }

    pushTokenRef.current = null;

    await clearStoredToken();
    setToken(null);
    setUser(null);
    analytics.reset();
    setSentryUser(null);
  }, []);

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      setToken: async (next: string) => {
        await storeToken(next);
        setToken(next);
      },
      onUnauthorized: async () => {
        await clearSession();
      },
    });

    return () => {
      clearApiClientHandlers();
    };
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const nextUser = await authApi.me(token);
    setUser(nextUser);
    await rememberRoleForUser(nextUser);
  }, [rememberRoleForUser, token]);

  const resendEmailVerification = useCallback(async () => {
    if (!token) {
      throw new Error("Please log in before resending verification email.");
    }

    await authApi.resendEmailVerification(token);
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      analytics.track(AnalyticsEvents.AuthLoginAttempt);

      try {
        const response = await authApi.login({ email, password });

        if (response.requires_two_factor) {
          analytics.track(AnalyticsEvents.AuthTwoFactorChallenge);
        } else {
          await applySession(response.access_token, response.user);
          analytics.track(AnalyticsEvents.AuthLoginSuccess);
        }

        return response;
      } catch (error) {
        analytics.track(AnalyticsEvents.AuthLoginFailure);
        throw error;
      }
    },
    [applySession],
  );

  const verifyTwoFactor = useCallback(
    async (email: string, challengeToken: string, code: string) => {
      try {
        const response = await authApi.verifyTwoFactor({
          email,
          challenge_token: challengeToken,
          code,
        });

        await applySession(response.access_token, response.user);
        analytics.track(AnalyticsEvents.AuthTwoFactorSuccess);
        return response.user;
      } catch (error) {
        analytics.track(AnalyticsEvents.AuthTwoFactorFailure);
        throw error;
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      analytics.track(AnalyticsEvents.AuthRegisterAttempt, {
        roles: input.roles.join(","),
      });

      try {
        const response = await authApi.register(input);
        await applySession(response.access_token, response.user);
        analytics.track(AnalyticsEvents.AuthRegisterSuccess);
        return response.user;
      } catch (error) {
        analytics.track(AnalyticsEvents.AuthRegisterFailure);
        throw error;
      }
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
    analytics.track(AnalyticsEvents.AuthLogout);
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
          analytics.identify(String(nextUser.id), { roles: nextUser.roles?.join(",") });
          setSentryUser({ id: nextUser.id, roles: nextUser.roles });

          syncPushTokenWithBackend(storedToken).then((pushToken) => {
            if (mounted) {
              pushTokenRef.current = pushToken;
            }
          });
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
      resendEmailVerification,
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
      resendEmailVerification,
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
