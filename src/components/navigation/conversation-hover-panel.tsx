"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConversationPreviewItem } from "@/components/layout/app-shell.types";

const truncate = (text: string, length = 120) => {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length - 1)}…`;
};

const formatRelative = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch (error) {
    console.error("ConversationHoverPanel:format", error);
    return "Just now";
  }
};

type ConversationHoverPanelProps = {
  conversations: ConversationPreviewItem[];
  currentUserId: number | null;
  onClose?: () => void;
};

const resolveAvatar = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

export function ConversationHoverPanel({ conversations, currentUserId, onClose }: ConversationHoverPanelProps) {
  const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0);

  return (
    <div className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-soft bg-surface-card text-primary shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-soft/60 bg-[var(--color-surface-primary-soft)] px-5 pb-4 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary">Recent conversations</p>
            {unreadTotal > 0 ? (
              <Badge
                variant="secondary"
                className="bg-[var(--color-primary-start)] text-white shadow-sm border-transparent"
              >
                {unreadTotal} unread
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-secondary">
            {unreadTotal > 0 ? `${unreadTotal} unread messages` : "All chats are up to date"}
          </p>
        </div>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto px-5 py-4">
        {conversations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-soft bg-surface-primary-soft p-4 text-xs text-secondary">
            Start a chat with your connections to see recent messages here.
          </p>
        ) : (
          conversations.map((conversation) => {
            const avatar = resolveAvatar(conversation.partnerAvatar ?? null);
            const isIncoming = currentUserId === null ? true : conversation.lastSenderId !== currentUserId;
            const unreadCount = conversation.unreadCount ?? 0;
            const hasUnread = unreadCount > 0 && isIncoming;
            const directionLabel = isIncoming
              ? `Received from ${conversation.partnerName}`
              : `Sent to ${conversation.partnerName}`;

            const messageSnippet = conversation.lastMessage && conversation.lastMessage.trim().length > 0
              ? truncate(conversation.lastMessage)
              : "No messages yet.";

            return (
              <Link
                key={conversation.partnerId}
                href={`/chat?user=${conversation.partnerId}`}
                onClick={onClose}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]",
                  hasUnread
                    ? "border-[var(--color-primary-start)] bg-[var(--color-primary-start)]/12 shadow-soft"
                    : "border-soft bg-[var(--color-surface-panel)] hover:border-[var(--color-primary-start)]/40 hover:bg-[var(--color-surface-primary-strong)]",
                )}
              >
                <Avatar
                  src={avatar}
                  alt={conversation.partnerName}
                  size="sm"
                  className="border border-soft bg-surface-primary-soft"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-primary group-hover:text-primary">
                      {conversation.partnerName}
                    </p>
                    {unreadCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-[var(--color-primary-start)] text-white border-transparent shadow-sm"
                      >
                        {unreadCount} new
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted">{directionLabel}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      hasUnread ? "font-semibold text-primary" : "text-secondary",
                    )}
                  >
                    {messageSnippet}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>@{conversation.partnerUsername}</span>
                    <span>{formatRelative(conversation.lastMessageAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="border-t border-soft/60 bg-[var(--color-surface-primary-soft)]/50 px-5 pb-5">
        <Button size="sm" variant="secondary" className="mt-4 w-full" asChild>
          <Link href="/chat" onClick={onClose}>
            Show all conversations
          </Link>
        </Button>
      </div>
    </div>
  );
}
