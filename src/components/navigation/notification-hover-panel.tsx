"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { NotificationPreviewItem } from "@/components/layout/app-shell.types";

const MAX_SNIPPET_LENGTH = 120;

const formatRelativeTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch (error) {
    console.error("NotificationHoverPanel:format", error);
    return "Just now";
  }
};

const buildSnippet = (message: string) => {
  if (message.length <= MAX_SNIPPET_LENGTH) {
    return message;
  }
  return `${message.slice(0, MAX_SNIPPET_LENGTH - 1)}…`;
};

type NotificationHoverPanelProps = {
  notifications: NotificationPreviewItem[];
  unreadCount: number;
  onClose?: () => void;
};

export function NotificationHoverPanel({ notifications, unreadCount, onClose }: NotificationHoverPanelProps) {
  return (
    <div className="w-[22rem] max-w-[85vw] rounded-3xl border border-soft bg-surface-card text-primary shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-soft/60 bg-[var(--color-surface-primary-soft)] px-5 pb-4 pt-5">
        <div>
          <p className="text-sm font-semibold text-primary">Notifications</p>
          <p className="text-xs text-secondary">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
        </div>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto px-5 py-4">
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-soft bg-surface-primary-soft p-4 text-xs text-secondary">
            We&apos;ll keep this space updated with your latest alerts.
          </p>
        ) : (
          notifications.map((notification) => {
            const targetHref = notification.link && notification.link.length > 0 ? notification.link : "/notifications";
            return (
              <Link
                key={notification.id}
                href={targetHref}
                onClick={onClose}
                className="group block rounded-2xl border border-soft bg-[var(--color-surface-panel)] p-4 text-sm transition-colors hover:border-[var(--color-primary-start)]/40 hover:bg-[var(--color-surface-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]"
              >
                <p className="text-sm font-semibold text-primary group-hover:text-primary">
                  {buildSnippet(notification.message)}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>{notification.senderName ?? "Community"}</span>
                  <span>{formatRelativeTime(notification.createdAt)}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="border-t border-soft/60 bg-[var(--color-surface-primary-soft)]/50 px-5 pb-5">
        <Button
          size="sm"
          variant="secondary"
          className="mt-4 w-full"
          asChild
        >
          <Link href="/notifications" onClick={onClose}>
            Show all notifications
          </Link>
        </Button>
      </div>
    </div>
  );
}
