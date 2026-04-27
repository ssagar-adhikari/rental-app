import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import type { IconName } from "@/types/rental";

const menuItems = [
  { icon: "person-outline", title: "Edit Profile", color: Colors.light.primary },
  { icon: "heart-outline", title: "Favorites", color: "#e74c3c" },
  { icon: "notifications-outline", title: "Notifications", color: "#f39c12" },
  { icon: "location-outline", title: "Saved Locations", color: "#27ae60" },
  { icon: "time-outline", title: "Booking History", color: "#9b59b6" },
  { icon: "wallet-outline", title: "Payment Methods", color: "#1abc9c" },
  { icon: "shield-checkmark-outline", title: "Privacy & Security", color: "#34495e" },
  { icon: "help-circle-outline", title: "Help & Support", color: "#3498db" },
  { icon: "information-circle-outline", title: "About Us", color: "#7f8c8d" },
] satisfies { icon: IconName; title: string; color: string }[];

export default function ProfileScreen() {
  const { user, loading, logout, enableTwoFactor, disableTwoFactor } = useAuth();
  const [securityBusy, setSecurityBusy] = useState(false);

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
              <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/login" as Href)}>
                <Text style={styles.primaryActionText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push("/register" as Href)}>
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
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Ionicons name="camera" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.roles.includes("vendor") ? "Vendor" : "Customer"}</Text>
                  <Text style={styles.statLabel}>Role</Text>
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
                  <Text style={styles.membershipSubtitle}>{user.roles.join(", ")}</Text>
                </View>
              </View>
              <TouchableOpacity disabled={securityBusy} style={styles.upgradeBtn} onPress={toggleTwoFactor}>
                <Text style={styles.upgradeBtnText}>{user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Account</Text>
              {menuItems.slice(0, 5).map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem}>
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
                <TouchableOpacity key={index} style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={styles.logoutText}>Log Out</Text>
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
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    ...Typography.label,
    marginTop: 20,
  },
});
