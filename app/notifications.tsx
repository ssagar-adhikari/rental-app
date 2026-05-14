import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/queries/notifications";
import type { AppNotification } from "@/services/notificationApi";

const ICON_FOR_TYPE: Record<string, keyof typeof Ionicons.glyphMap> = {
  "booking.created": "calendar-outline",
  "booking.confirmed": "checkmark-circle-outline",
  "booking.cancelled": "close-circle-outline",
  "message.received": "chatbubble-outline",
};

function iconFor(notification: AppNotification): keyof typeof Ionicons.glyphMap {
  const fromData = typeof notification.data.type === "string" ? ICON_FOR_TYPE[notification.data.type] : undefined;
  return fromData ?? "notifications-outline";
}

function timestamp(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { data, error, isPending, isRefetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

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
        <AppHeader eyebrow="Account" title="Notifications" subtitle="Updates about your bookings and conversations." icon="notifications-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view notifications"
          description="Notifications are tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  function openNotification(item: AppNotification) {
    if (!item.read_at) {
      markRead.mutate(item.id);
    }
    const path = typeof item.data.path === "string" ? item.data.path : null;
    if (path) {
      router.push(path as Href);
    }
  }

  const notifications = data?.data ?? [];
  const unreadTotal = data?.meta.unread_total ?? 0;

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="Notifications"
        subtitle={unreadTotal > 0 ? `${unreadTotal} unread` : "All caught up."}
        icon="notifications-outline"
      />

      {unreadTotal > 0 ? (
        <View style={styles.toolbar}>
          <TouchableOpacity
            accessibilityLabel="Mark all notifications as read"
            accessibilityRole="button"
            accessibilityState={{ disabled: markAllRead.isPending }}
            activeOpacity={0.85}
            disabled={markAllRead.isPending}
            onPress={() => markAllRead.mutate()}
            style={styles.markAllButton}
          >
            <Ionicons color={Colors.light.primary} name="checkmark-done-outline" size={16} />
            <Text style={styles.markAllText}>{markAllRead.isPending ? "Marking..." : "Mark all read"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {error && !notifications.length ? (
        <ErrorState
          title="Couldn't load notifications"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <LoadingState message="Loading notifications..." />
      ) : (
        <FlatList
          contentContainerStyle={notifications.length ? styles.list : styles.empty}
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} tintColor={Colors.light.primary} onRefresh={() => refetch()} />}
          renderItem={({ item }) => {
            const unread = !item.read_at;
            const title = typeof item.data.title === "string" ? item.data.title : "Notification";
            const body = typeof item.data.body === "string" ? item.data.body : "";

            return (
              <TouchableOpacity
                accessibilityLabel={`Open notification: ${title}`}
                accessibilityRole="button"
                activeOpacity={0.88}
                onPress={() => openNotification(item)}
                style={[styles.row, unread && styles.rowUnread]}
              >
                <View style={[styles.rowIcon, unread && styles.rowIconUnread]}>
                  <Ionicons color={unread ? "white" : Colors.light.primary} name={iconFor(item)} size={20} />
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  {body ? <Text style={styles.rowBodyText} numberOfLines={2}>{body}</Text> : null}
                  <Text style={styles.rowTime}>{timestamp(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications yet"
              description="Booking updates and new messages will show up here."
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
  toolbar: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  markAllButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  markAllText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  list: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
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
  rowUnread: {
    borderColor: "#DDE4FF",
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rowIconUnread: {
    backgroundColor: Colors.light.primary,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rowTitle: {
    color: Colors.light.text,
    flex: 1,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  unreadDot: {
    backgroundColor: Colors.light.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  rowBodyText: {
    color: Colors.light.text,
    marginTop: 4,
    ...Typography.body,
  },
  rowTime: {
    color: Colors.light.muted,
    marginTop: 4,
    ...Typography.eyebrow,
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
