export type NotificationPreviewItem = {
  id: number;
  message: string;
  createdAt: string;
  link?: string | null;
  senderName?: string | null;
  isRead: boolean;
};

export type ConversationPreviewItem = {
  partnerId: number;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: number;
  unreadCount: number;
};
