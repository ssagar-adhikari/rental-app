import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useConversation, useMarkConversationRead, useSendMessage } from "@/hooks/queries/conversations";
import type { Message } from "@/services/conversationApi";

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function ConversationThreadScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();

  const conversationId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.id]);

  const { data, isPending, error } = useConversation(conversationId);
  const sendMessage = useSendMessage(conversationId ?? 0);
  const markRead = useMarkConversationRead();

  const [draft, setDraft] = useState("");

  // Stamp this conversation as read whenever we land on the screen. We
  // also stamp again whenever there are unread messages from the other
  // side — that's the bare minimum without an "is window focused" hook.
  useEffect(() => {
    if (conversationId && data?.conversation && data.conversation.unread_count > 0) {
      markRead.mutate(conversationId);
    }
  }, [conversationId, data?.conversation, data?.conversation?.unread_count, markRead]);

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
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view messages"
          description="Conversations are tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.replace("/login" as Href) }}
        />
      </Screen>
    );
  }

  if (!conversationId) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Conversation not found" description="This link is missing a conversation id." />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen>
        <ErrorState
          title="Couldn't load conversation"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => router.replace(`/conversations/${conversationId}` as Href)}
        />
      </Screen>
    );
  }

  if (isPending || !data) {
    return (
      <Screen>
        <LoadingState message="Loading messages..." />
      </Screen>
    );
  }

  const other = data.conversation.participants.find((p) => p.id !== user?.id);
  const messages = data.messages.data;

  async function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");

    try {
      await sendMessage.mutateAsync({ body: trimmed });
    } catch (exception) {
      // Restore the draft so the user can retry. Surface the error inline
      // via the mutation's error state below the input.
      setDraft(trimmed);
      throw exception;
    }
  }

  const sendError = sendMessage.error instanceof Error ? sendMessage.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Back to inbox"
            accessibilityRole="button"
            activeOpacity={0.88}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
          </TouchableOpacity>
          <View style={styles.headerBody}>
            <Text style={styles.headerName} numberOfLines={1}>{other?.name ?? "Conversation"}</Text>
            {data.conversation.listing ? (
              <Text style={styles.headerContext} numberOfLines={1}>About {data.conversation.listing.title}</Text>
            ) : data.conversation.booking ? (
              <Text style={styles.headerContext} numberOfLines={1}>Booking {data.conversation.booking.booking_number}</Text>
            ) : null}
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.messages}
          data={messages}
          inverted
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MessageBubble message={item} viewerId={user?.id} />}
          ListEmptyComponent={
            <Text style={styles.emptyMessages}>No messages yet. Say hi.</Text>
          }
        />

        {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message"
            multiline
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={Colors.light.muted}
            style={styles.composerInput}
            value={draft}
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !draft.trim() || sendMessage.isPending, busy: sendMessage.isPending }}
            activeOpacity={0.85}
            disabled={!draft.trim() || sendMessage.isPending}
            onPress={() => {
              submit().catch(() => null);
            }}
            style={[styles.sendButton, (!draft.trim() || sendMessage.isPending) && styles.sendButtonDisabled]}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons color="white" name="send" size={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function MessageBubble({ message, viewerId }: { message: Message; viewerId: number | undefined }) {
  const mine = viewerId === message.sender_id;

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>{formatTime(message.created_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderBottomColor: Colors.light.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  headerContext: {
    color: Colors.light.primary,
    marginTop: 2,
    ...Typography.eyebrow,
  },
  messages: {
    flexGrow: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  emptyMessages: {
    color: Colors.light.muted,
    paddingVertical: Spacing.xxxl,
    textAlign: "center",
    ...Typography.body,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleLeft: {
    justifyContent: "flex-start",
  },
  bubbleRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    borderRadius: Radius.lg,
    maxWidth: "78%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleMine: {
    backgroundColor: Colors.light.primary,
  },
  bubbleTheirs: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderWidth: 1,
  },
  bubbleText: {
    ...Typography.body,
  },
  bubbleTextMine: {
    color: "white",
  },
  bubbleTextTheirs: {
    color: Colors.light.text,
  },
  bubbleTime: {
    marginTop: 4,
    ...Typography.eyebrow,
  },
  bubbleTimeMine: {
    color: "rgba(255,255,255,0.78)",
  },
  bubbleTimeTheirs: {
    color: Colors.light.muted,
  },
  sendError: {
    color: Colors.light.danger,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    ...Typography.label,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: Colors.light.surface,
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  composerInput: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    color: Colors.light.text,
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
