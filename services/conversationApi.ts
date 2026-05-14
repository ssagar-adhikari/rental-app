import { apiRequest } from "@/services/apiClient";

export type ConversationParticipantSummary = {
  id: number;
  name: string | null;
};

export type ConversationListingRef = {
  id: number;
  title: string;
  slug: string | null;
};

export type ConversationBookingRef = {
  id: number;
  booking_number: string;
};

export type Message = {
  id: number;
  sender_id: number;
  sender_name: string | null;
  body: string;
  attachments: unknown | null;
  read_at: string | null;
  created_at: string;
};

export type ConversationSummary = {
  id: number;
  listing: ConversationListingRef | null;
  booking: ConversationBookingRef | null;
  last_message_at: string | null;
  last_read_at: string | null;
  unread_count: number;
  latest_message: Message | null;
  participants: ConversationParticipantSummary[];
};

export type PaginatedConversations = {
  data: ConversationSummary[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type PaginatedMessages = {
  data: Message[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ConversationDetail = {
  conversation: ConversationSummary;
  messages: PaginatedMessages;
};

export type StartConversationBody = {
  recipient_id: number;
  listing_id?: number;
  booking_id?: number;
  body: string;
};

export type SendMessageBody = {
  body: string;
  attachments?: { url: string; mime_type?: string }[];
};

export type SentMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  attachments: unknown | null;
  created_at: string;
};

export const conversationApi = {
  list(token: string, page = 1) {
    return apiRequest<PaginatedConversations>(`/conversations?page=${page}`, { token });
  },

  show(id: number, token: string, page = 1) {
    return apiRequest<ConversationDetail>(`/conversations/${id}?page=${page}`, { token });
  },

  start(body: StartConversationBody, token: string) {
    return apiRequest<ConversationSummary>("/conversations", { method: "POST", body, token });
  },

  markRead(id: number, token: string) {
    return apiRequest<null>(`/conversations/${id}/read`, { method: "POST", token });
  },

  sendMessage(id: number, body: SendMessageBody, token: string) {
    return apiRequest<SentMessage>(`/conversations/${id}/messages`, { method: "POST", body, token });
  },
};
