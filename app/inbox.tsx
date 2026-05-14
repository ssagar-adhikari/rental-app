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
import { useConversations } from "@/hooks/queries/conversations";
import type { ConversationSummary } from "@/services/conversationApi";

function counterpart(conversation: ConversationSummary, currentUserId: number | undefined): string {
  const other = conversation.participants.find((participant) => participant.id !== currentUserId);
  return other?.name ?? "Conversation";
}

function preview(conversation: ConversationSummary): string {
  if (!conversation.latest_message) {
    return "No messages yet.";
  }
  return conversation.latest_message.body;
}

function timestamp(value: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function InboxScreen() {
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();
  const { data, isPending, error, isRefetching, refetch } = useConversations();

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
        <AppHeader eyebrow="Account" title="Messages" subtitle="Chat with vendors and customers about a listing or booking." icon="chatbubbles-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view messages"
          description="Messaging is tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  const conversations = data?.data ?? [];

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="Messages"
        subtitle="Conversations refresh every few seconds while open."
        icon="chatbubbles-outline"
      />

      {error && !conversations.length ? (
        <ErrorState
          title="Couldn't load messages"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <LoadingState message="Loading conversations..." />
      ) : (
        <FlatList
          contentContainerStyle={conversations.length ? styles.list : styles.empty}
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isRefetching} tintColor={Colors.light.primary} onRefresh={() => refetch()} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityLabel={`Open conversation with ${counterpart(item, user?.id)}`}
              accessibilityRole="button"
              activeOpacity={0.88}
              onPress={() => router.push(`/conversations/${item.id}` as Href)}
              style={styles.row}
            >
              <View style={styles.rowAvatar}>
                <Ionicons color={Colors.light.primary} name="person-outline" size={22} />
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTitleRow}>
                  <Text style={styles.rowName} numberOfLines={1}>{counterpart(item, user?.id)}</Text>
                  {item.unread_count > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
                {item.listing ? (
                  <Text style={styles.rowContext} numberOfLines={1}>About: {item.listing.title}</Text>
                ) : item.booking ? (
                  <Text style={styles.rowContext} numberOfLines={1}>Booking {item.booking.booking_number}</Text>
                ) : null}
                <Text style={styles.rowPreview} numberOfLines={1}>{preview(item)}</Text>
                {item.last_message_at ? <Text style={styles.rowTime}>{timestamp(item.last_message_at)}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              description="Tap the Message button on a listing to start one."
              action={{ label: "Browse listings", icon: "search-outline", onPress: () => router.push("/(tabs)" as Href) }}
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
  rowAvatar: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
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
  rowName: {
    color: Colors.light.text,
    flex: 1,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "white",
    ...Typography.eyebrow,
    fontWeight: "900",
  },
  rowContext: {
    color: Colors.light.primary,
    marginTop: 2,
    ...Typography.eyebrow,
  },
  rowPreview: {
    color: Colors.light.muted,
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
