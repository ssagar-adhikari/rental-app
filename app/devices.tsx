import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useDevices, useRevokeDevice } from "@/hooks/queries/devices";
import type { DeviceSession } from "@/services/deviceApi";

function lastSeen(value: string | null): string {
  if (!value) return "Never used";
  try {
    return `Last used ${new Date(value).toLocaleString()}`;
  } catch {
    return "Last used unknown";
  }
}

function statusLabel(device: DeviceSession): { label: string; tone: "active" | "revoked" | "expired" } {
  if (device.revoked_at) {
    return { label: "Revoked", tone: "revoked" };
  }
  if (device.expires_at && new Date(device.expires_at) < new Date()) {
    return { label: "Expired", tone: "expired" };
  }
  return { label: "Active", tone: "active" };
}

export default function DevicesScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { data, isPending, error, isRefetching, refetch } = useDevices();
  const revokeDevice = useRevokeDevice();

  if (authLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen>
        <AppHeader eyebrow="Security" title="Active devices" subtitle="See where your account is signed in." icon="phone-portrait-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view devices"
          description="Device management is tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  function confirmRevoke(device: DeviceSession) {
    Alert.alert(
      `Sign out "${device.device_name ?? "this device"}"?`,
      "The session will be revoked immediately. They'll need to log in again.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: () => revokeDevice.mutate(device.id) },
      ],
    );
  }

  const devices = data ?? [];
  const activeCount = devices.filter((d) => !d.revoked_at).length;

  return (
    <Screen>
      <AppHeader
        eyebrow="Security"
        title="Active devices"
        subtitle={`${activeCount} session${activeCount === 1 ? "" : "s"} signed in. Revoke any you don't recognize.`}
        icon="phone-portrait-outline"
      />

      {error && !devices.length ? (
        <ErrorState
          title="Couldn't load devices"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <LoadingState message="Loading devices..." />
      ) : (
        <FlatList
          contentContainerStyle={devices.length ? styles.list : styles.empty}
          data={devices}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isRefetching} tintColor={Colors.light.primary} onRefresh={() => refetch()} />}
          renderItem={({ item }) => {
            const status = statusLabel(item);
            const revoked = !!item.revoked_at;

            return (
              <View style={[styles.row, revoked && styles.rowRevoked]}>
                <View style={styles.rowIcon}>
                  <Ionicons color={Colors.light.primary} name="phone-portrait-outline" size={22} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.device_name ?? "Unknown device"}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{lastSeen(item.last_used_at)}</Text>
                  {item.ip_address ? <Text style={styles.rowMeta} numberOfLines={1}>IP {item.ip_address}</Text> : null}
                </View>
                <View style={styles.rowAction}>
                  <View style={[styles.statusPill, status.tone === "active" && styles.statusActive, status.tone === "revoked" && styles.statusRevoked, status.tone === "expired" && styles.statusExpired]}>
                    <Text style={[styles.statusText, status.tone === "active" && styles.statusActiveText, status.tone === "revoked" && styles.statusRevokedText, status.tone === "expired" && styles.statusExpiredText]}>
                      {status.label}
                    </Text>
                  </View>
                  {!revoked ? (
                    <TouchableOpacity
                      accessibilityLabel={`Sign out ${item.device_name ?? "device"}`}
                      accessibilityRole="button"
                      activeOpacity={0.85}
                      onPress={() => confirmRevoke(item)}
                      style={styles.revokeButton}
                    >
                      <Ionicons color={Colors.light.danger} name="log-out-outline" size={16} />
                      <Text style={styles.revokeText}>Sign out</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="phone-portrait-outline"
              title="No devices on file"
              description="Sessions appear here after you log in on a new device."
            />
          }
        />
      )}

      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.88}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 110,
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    alignItems: "flex-start",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowRevoked: {
    opacity: 0.55,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  rowMeta: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  rowAction: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: Colors.light.successSoft,
  },
  statusRevoked: {
    backgroundColor: Colors.light.dangerSoft,
  },
  statusExpired: {
    backgroundColor: Colors.light.warningSoft,
  },
  statusText: {
    ...Typography.eyebrow,
    fontWeight: "900",
  },
  statusActiveText: {
    color: Colors.light.success,
  },
  statusRevokedText: {
    color: Colors.light.danger,
  },
  statusExpiredText: {
    color: Colors.light.warning,
  },
  revokeButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  revokeText: {
    color: Colors.light.danger,
    ...Typography.label,
    fontWeight: "900",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    left: Spacing.xl,
    position: "absolute",
    top: Spacing.xl,
    width: 44,
  },
});
