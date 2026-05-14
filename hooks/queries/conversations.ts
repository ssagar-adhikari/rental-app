import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  conversationApi,
  type ConversationSummary,
  type SendMessageBody,
  type StartConversationBody,
} from "@/services/conversationApi";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: (userId?: number) => [...conversationKeys.all, "list", userId] as const,
  detail: (id: number) => [...conversationKeys.all, "detail", id] as const,
};

export function useConversations() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: conversationKeys.list(user?.id),
    queryFn: () => conversationApi.list(token!),
    enabled: !!token,
    // Refresh the inbox every 30s when mounted so unread counts stay
    // roughly current without a websocket. Cheap query — paginated list.
    refetchInterval: 30_000,
  });
}

export function useConversation(id: number | null) {
  const { token } = useAuth();
  const enabled = !!token && !!id && id > 0;

  return useQuery({
    queryKey: id ? conversationKeys.detail(id) : [...conversationKeys.all, "detail", "disabled"],
    queryFn: () => conversationApi.show(id!, token!),
    enabled,
    // Poll for new messages while the thread is open. 3s feels live enough
    // without burning data. Switch to Reverb (audit §4 follow-up) when
    // websockets land.
    refetchInterval: 3_000,
  });
}

export function useStartConversation() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StartConversationBody) => {
      if (!token) {
        throw new Error("Sign in to start a conversation.");
      }
      return conversationApi.start(body, token);
    },
    onSuccess: (conversation) => {
      // Optimistically prepend to inbox so the user sees it appear when
      // they navigate back. If find-or-create returned an existing thread,
      // the next refetch will dedupe based on id.
      queryClient.setQueryData<{ data: ConversationSummary[]; meta: unknown }>(
        conversationKeys.list(user?.id),
        (current) => {
          if (!current) return current;
          const without = current.data.filter((c) => c.id !== conversation.id);
          return { ...current, data: [conversation, ...without] };
        },
      );
    },
  });
}

export function useSendMessage(conversationId: number) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SendMessageBody) => {
      if (!token) {
        throw new Error("Sign in to send messages.");
      }
      return conversationApi.sendMessage(conversationId, body, token);
    },
    onSuccess: () => {
      // Refetch the thread so the new message + the bumped last_message_at
      // hit the UI. Polling will pick it up within ~3s anyway, but the
      // explicit invalidate makes the post-send moment feel instant.
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.list(user?.id) });
    },
  });
}

export function useMarkConversationRead() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      if (!token) {
        throw new Error("Sign in to mark conversations as read.");
      }
      return conversationApi.markRead(id, token);
    },
    onMutate: async (id) => {
      // Optimistic: zero out unread on the row in the inbox cache.
      const listKey = conversationKeys.list(user?.id);
      const previous = queryClient.getQueryData<{ data: ConversationSummary[]; meta: unknown }>(listKey);

      queryClient.setQueryData(listKey, (current: typeof previous) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((c) =>
            c.id === id ? { ...c, unread_count: 0, last_read_at: new Date().toISOString() } : c,
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(conversationKeys.list(user?.id), context.previous);
      }
    },
  });
}
