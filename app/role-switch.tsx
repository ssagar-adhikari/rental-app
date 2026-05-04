import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getAvailableAppRoles, getPostAuthRoute, getRoleRoute, type AppRole } from "@/utils/authRoutes";

const roleContent: Record<AppRole, { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }> = {
  customer: {
    icon: "bag-handle-outline",
    title: "Use as Customer",
    subtitle: "Browse listings, save rentals, and manage bookings.",
  },
  vendor: {
    icon: "storefront-outline",
    title: "Use as Vendor",
    subtitle: "Open your dashboard, manage listings, and handle bookings.",
  },
};

export default function RoleSwitchScreen() {
  const { activeRole, loading, selectRole, user } = useAuth();

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const availableRoles = getAvailableAppRoles(user);

  if (availableRoles.length < 2) {
    return <Redirect href={getPostAuthRoute(user, activeRole)} />;
  }

  async function chooseRole(role: AppRole) {
    await selectRole(role);
    router.replace(getRoleRoute(role));
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="swap-horizontal-outline" size={24} color="white" />
          </View>
          <Text style={styles.eyebrow}>Choose Mode</Text>
          <Text style={styles.title}>How do you want to continue?</Text>
          <Text style={styles.subtitle}>You can switch between customer and vendor mode anytime.</Text>
        </View>

        <View style={styles.cardStack}>
          {availableRoles.map((role) => {
            const content = roleContent[role];
            const selected = activeRole === role;

            return (
              <TouchableOpacity
                activeOpacity={0.86}
                key={role}
                style={[styles.roleCard, selected && styles.selectedRoleCard]}
                onPress={() => chooseRole(role)}
              >
                <View style={[styles.roleIcon, selected && styles.selectedRoleIcon]}>
                  <Ionicons name={content.icon} size={24} color={selected ? "white" : Colors.light.primary} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{content.title}</Text>
                  <Text style={styles.roleSubtitle}>{content.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={Colors.light.primary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  header: {
    backgroundColor: Colors.light.primary,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingBottom: 70,
    paddingHorizontal: Spacing.xl,
    paddingTop: 50,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.pill,
    height: 46,
    justifyContent: "center",
    marginBottom: Spacing.xxl,
    width: 46,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    ...Typography.label,
  },
  title: {
    color: "white",
    marginTop: Spacing.sm,
    ...Typography.screenTitle,
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  cardStack: {
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: -42,
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 96,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  selectedRoleCard: {
    borderColor: Colors.light.primary,
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  selectedRoleIcon: {
    backgroundColor: Colors.light.primary,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  roleSubtitle: {
    color: Colors.light.muted,
    marginTop: 3,
    ...Typography.body,
  },
});
