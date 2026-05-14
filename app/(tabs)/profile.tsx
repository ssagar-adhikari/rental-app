import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { accountApi } from "@/services/accountApi";
import { ApiError } from "@/services/authApi";
import type { UserRole } from "@/types/auth";
import { getPostAuthRoute, getRoleRoute, hasMultipleAppRoles, type AppRole } from "@/utils/authRoutes";
import type { IconName } from "@/types/rental";

const menuItems = [
  { icon: "person-outline", title: "Edit Profile", color: Colors.light.primary, route: null },
  { icon: "heart-outline", title: "Favorites", color: "#e74c3c", route: "/favorites" as Href },
  { icon: "bookmark-outline", title: "Saved Searches", color: Colors.light.primary, route: "/saved-searches" as Href },
  { icon: "chatbubbles-outline", title: "Messages", color: "#16a085", route: "/inbox" as Href },
  { icon: "notifications-outline", title: "Notifications", color: "#f39c12", route: "/notifications" as Href },
  { icon: "location-outline", title: "Saved Locations", color: "#27ae60", route: null },
  { icon: "time-outline", title: "Booking History", color: "#9b59b6", route: null },
  { icon: "wallet-outline", title: "Payment Methods", color: "#1abc9c", route: null },
  { icon: "phone-portrait-outline", title: "Devices", color: "#34495e", route: "/devices" as Href },
  { icon: "shield-checkmark-outline", title: "Privacy & Security", color: "#34495e", route: null },
  { icon: "help-circle-outline", title: "Help & Support", color: "#3498db", route: null },
  { icon: "information-circle-outline", title: "About Us", color: "#7f8c8d", route: null },
] satisfies { icon: IconName; title: string; color: string; route: Href | null }[];

const roleLabels: Record<AppRole, string> = {
  customer: "Customer",
  vendor: "Vendor",
};

function formatRoles(roles: UserRole[]) {
  const labels = roles
    .filter((role): role is AppRole => role === "customer" || role === "vendor")
    .map((role) => roleLabels[role]);

  return labels.length ? labels.join(" + ") : "No role";
}

function formatRoleSummary(roles: UserRole[]) {
  return roles.includes("customer") && roles.includes("vendor") ? "Both" : formatRoles(roles);
}

export default function ProfileScreen() {
  const { activeRole, user, token, loading, logout, addRole, selectRole, enableTwoFactor, disableTwoFactor } = useAuth();
  const [securityBusy, setSecurityBusy] = useState(false);
  const [roleBusy, setRoleBusy] = useState<AppRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function performAccountDeletion() {
    if (!token) {
      return;
    }

    setDeleteBusy(true);

    try {
      await accountApi.requestDeletion(null, token);
      await logout();
      router.replace("/(tabs)" as Href);
    } catch (exception) {
      setDeleteBusy(false);
      Alert.alert(
        "Deletion request failed",
        exception instanceof ApiError ? exception.message : "Unable to submit deletion request.",
      );
    }
  }

  function confirmAccountDeletion() {
    Alert.alert(
      "Delete your account?",
      "This will anonymize your profile and sign you out. Your booking history is preserved for the other party but no longer linked to you. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performAccountDeletion },
      ],
    );
  }

  async function toggleTwoFactor() {
    setSecurityBusy(true);

    try {
      if (user?.two_factor_enabled) {
        await disableTwoFactor();
      } else {
        await enableTwoFactor();
      }
    } finally {
      setSecurityBusy(false);
    }
  }

  async function attachRole(role: AppRole) {
    setRoleBusy(role);
    setRoleError(null);

    try {
      const nextUser = await addRole(role);

      if (nextUser) {
        router.replace(getPostAuthRoute(nextUser, role));
      }
    } catch (exception) {
      setRoleError(exception instanceof ApiError ? exception.message : "Unable to update account role.");
    } finally {
      setRoleBusy(null);
    }
  }

  async function switchRole(role: AppRole) {
    await selectRole(role);
    router.replace(getRoleRoute(role));
  }

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Manage bookings, saved listings, payments, and account preferences."
        icon="settings-outline"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.profileCard}>
            <Text style={styles.userName}>Loading account...</Text>
          </View>
        ) : null}

        {!loading && !user ? (
          <View style={styles.profileCard}>
            <View style={styles.guestIcon}>
              <Ionicons name="person-circle-outline" size={52} color={Colors.light.primary} />
            </View>
            <Text style={styles.userName}>Sign in to continue</Text>
            <Text style={styles.userEmail}>Manage bookings, saved listings, and provider tools.</Text>
            <View style={styles.authActions}>
              <TouchableOpacity
                accessibilityLabel="Log in"
                accessibilityRole="button"
                style={styles.primaryAction}
                onPress={() => router.push("/login" as Href)}
              >
                <Text style={styles.primaryActionText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Register"
                accessibilityRole="button"
                style={styles.secondaryAction}
                onPress={() => router.push("/register" as Href)}
              >
                <Text style={styles.secondaryActionText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {user ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" }}
                  style={styles.avatar}
                />
                <TouchableOpacity accessibilityLabel="Change profile photo" accessibilityRole="button" style={styles.editAvatarBtn}>
                  <Ionicons name="camera" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatRoleSummary(user.roles)}</Text>
                  <Text style={styles.statLabel}>Roles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.email_verified ? "Yes" : "No"}</Text>
                  <Text style={styles.statLabel}>Verified</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.two_factor_enabled ? "On" : "Off"}</Text>
                  <Text style={styles.statLabel}>2FA</Text>
                </View>
              </View>
            </View>

            <View style={styles.membershipCard}>
              <View style={styles.membershipLeft}>
                <Ionicons name="shield-checkmark" size={24} color="#f39c12" />
                <View style={styles.membershipInfo}>
                  <Text style={styles.membershipTitle}>{user.email_verified ? "Verified account" : "Email verification pending"}</Text>
                  <Text style={styles.membershipSubtitle}>{formatRoles(user.roles)}</Text>
                </View>
              </View>
              <TouchableOpacity
                accessibilityLabel={user.two_factor_enabled ? "Disable two-factor authentication" : "Enable two-factor authentication"}
                accessibilityRole="button"
                accessibilityState={{ disabled: securityBusy }}
                disabled={securityBusy}
                style={styles.upgradeBtn}
                onPress={toggleTwoFactor}
              >
                <Text style={styles.upgradeBtnText}>{user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}</Text>
              </TouchableOpacity>
            </View>

            {hasMultipleAppRoles(user) ? (
              <View style={styles.roleUpgradeCard}>
                <View style={styles.roleUpgradeHeader}>
                  <Ionicons name="swap-horizontal-outline" size={22} color={Colors.light.primary} />
                  <View style={styles.roleUpgradeInfo}>
                    <Text style={styles.roleUpgradeTitle}>Active mode</Text>
                    <Text style={styles.roleUpgradeSubtitle}>Switch between customer and vendor whenever you need.</Text>
                  </View>
                </View>

                <View style={styles.roleActionRow}>
                  <TouchableOpacity
                    accessibilityLabel="Switch to customer mode"
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeRole === "customer" }}
                    activeOpacity={0.86}
                    style={[styles.roleActionButton, activeRole !== "customer" && styles.inactiveRoleAction]}
                    onPress={() => switchRole("customer")}
                  >
                    <Ionicons name="bag-handle-outline" size={18} color={activeRole === "customer" ? "white" : Colors.light.primary} />
                    <Text style={[styles.roleActionText, activeRole !== "customer" && styles.inactiveRoleActionText]}>
                      {activeRole === "customer" ? "Customer Active" : "Customer Mode"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityLabel="Switch to vendor mode"
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeRole === "vendor" }}
                    activeOpacity={0.86}
                    style={[styles.roleActionButton, activeRole !== "vendor" && styles.inactiveRoleAction]}
                    onPress={() => switchRole("vendor")}
                  >
                    <Ionicons name="storefront-outline" size={18} color={activeRole === "vendor" ? "white" : Colors.light.primary} />
                    <Text style={[styles.roleActionText, activeRole !== "vendor" && styles.inactiveRoleActionText]}>
                      {activeRole === "vendor" ? "Vendor Active" : "Vendor Mode"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {!user.roles.includes("vendor") || !user.roles.includes("customer") ? (
              <View style={styles.roleUpgradeCard}>
                <View style={styles.roleUpgradeHeader}>
                  <Ionicons name="swap-horizontal-outline" size={22} color={Colors.light.primary} />
                  <View style={styles.roleUpgradeInfo}>
                    <Text style={styles.roleUpgradeTitle}>Use another role</Text>
                    <Text style={styles.roleUpgradeSubtitle}>Add the missing account type to this same login.</Text>
                  </View>
                </View>

                <View style={styles.roleActionRow}>
                  {!user.roles.includes("vendor") ? (
                    <TouchableOpacity
                      accessibilityLabel="Add vendor role"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: roleBusy !== null }}
                      activeOpacity={0.86}
                      disabled={roleBusy !== null}
                      style={[styles.roleActionButton, roleBusy !== null && styles.disabledRoleAction]}
                      onPress={() => attachRole("vendor")}
                    >
                      <Ionicons name="storefront-outline" size={18} color="white" />
                      <Text style={styles.roleActionText}>{roleBusy === "vendor" ? "Adding..." : "Add Vendor"}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {!user.roles.includes("customer") ? (
                    <TouchableOpacity
                      accessibilityLabel="Add customer role"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: roleBusy !== null }}
                      activeOpacity={0.86}
                      disabled={roleBusy !== null}
                      style={[styles.roleActionButton, roleBusy !== null && styles.disabledRoleAction]}
                      onPress={() => attachRole("customer")}
                    >
                      <Ionicons name="bag-handle-outline" size={18} color="white" />
                      <Text style={styles.roleActionText}>{roleBusy === "customer" ? "Adding..." : "Add Customer"}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {roleError ? <Text style={styles.roleError}>{roleError}</Text> : null}
              </View>
            ) : null}

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Account</Text>
              {menuItems.slice(0, 5).map((item, index) => (
                <TouchableOpacity
                  accessibilityLabel={item.title}
                  accessibilityRole="button"
                  key={index}
                  style={styles.menuItem}
                  onPress={() => (item.route ? router.push(item.route) : null)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Settings</Text>
              {menuItems.slice(5).map((item, index) => (
                <TouchableOpacity
                  accessibilityLabel={item.title}
                  accessibilityRole="button"
                  key={index}
                  style={styles.menuItem}
                  onPress={() => (item.route ? router.push(item.route) : null)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity accessibilityLabel="Log out" accessibilityRole="button" style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel="Delete account"
              accessibilityRole="button"
              accessibilityState={{ disabled: deleteBusy, busy: deleteBusy }}
              activeOpacity={0.85}
              disabled={deleteBusy}
              style={[styles.deleteBtn, deleteBusy && styles.deleteBtnDisabled]}
              onPress={confirmAccountDeletion}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
              <Text style={styles.deleteText}>{deleteBusy ? "Submitting..." : "Delete account"}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <Text style={styles.versionText}>Version 1.0.0</Text>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.xl,
    marginTop: 18,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  guestIcon: {
    alignItems: "center",
    backgroundColor: "#EEF6FF",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  authActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: "100%",
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  primaryActionText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryActionText: {
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "900",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary,
    borderRadius: 15,
    padding: 8,
  },
  userName: {
    color: Colors.light.text,
    marginTop: Spacing.md,
    ...Typography.sectionTitle,
  },
  userEmail: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.body,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: Colors.light.primary,
    ...Typography.sectionTitle,
  },
  statLabel: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.eyebrow,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  membershipCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: Spacing.xl,
    marginTop: 15,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.light.primary,
    ...Shadows.card,
  },
  membershipLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  membershipInfo: {
    flex: 1,
    marginLeft: 12,
  },
  membershipTitle: {
    color: "white",
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  membershipSubtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    ...Typography.eyebrow,
  },
  upgradeBtn: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: Spacing.md,
  },
  upgradeBtnText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  roleUpgradeCard: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  roleUpgradeHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleUpgradeInfo: {
    flex: 1,
  },
  roleUpgradeTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  roleUpgradeSubtitle: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.eyebrow,
  },
  roleActionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  roleActionButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  inactiveRoleAction: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.border,
    borderWidth: 1,
  },
  disabledRoleAction: {
    opacity: 0.7,
  },
  roleActionText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  inactiveRoleActionText: {
    color: Colors.light.primary,
  },
  roleError: {
    color: Colors.light.danger,
    marginTop: Spacing.md,
    ...Typography.label,
  },
  menuSection: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: Radius.lg,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  menuSectionTitle: {
    color: Colors.light.muted,
    marginBottom: 10,
    marginLeft: 5,
    ...Typography.label,
    fontWeight: "900",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F7",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    flex: 1,
    color: Colors.light.text,
    marginLeft: 12,
    ...Typography.cardTitle,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FAD4D4",
    marginHorizontal: Spacing.xl,
    marginTop: 25,
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  logoutText: {
    color: Colors.light.danger,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  deleteBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    color: Colors.light.danger,
    ...Typography.label,
    fontWeight: "900",
  },
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    ...Typography.label,
    marginTop: 20,
  },
});
