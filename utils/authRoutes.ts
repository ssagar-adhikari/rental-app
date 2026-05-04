import type { Href } from "expo-router";
import type { AuthUser, UserRole } from "@/types/auth";

export type AppRole = Exclude<UserRole, "admin">;

export function getAvailableAppRoles(user: AuthUser): AppRole[] {
  return user.roles.filter((role): role is AppRole => role === "customer" || role === "vendor");
}

export function canUseRole(user: AuthUser, role: AppRole | null): role is AppRole {
  return role !== null && getAvailableAppRoles(user).includes(role);
}

export function hasMultipleAppRoles(user: AuthUser) {
  return getAvailableAppRoles(user).length > 1;
}

export function getRoleRoute(role: AppRole): Href {
  return role === "vendor" ? "/vendor-dashboard" : "/(tabs)/profile";
}

export function getPostAuthRoute(user: AuthUser, activeRole: AppRole | null): Href {
  if (canUseRole(user, activeRole)) {
    return getRoleRoute(activeRole);
  }

  const roles = getAvailableAppRoles(user);

  if (roles.length > 1) {
    return "/role-switch";
  }

  return getRoleRoute(roles[0] ?? "customer");
}
