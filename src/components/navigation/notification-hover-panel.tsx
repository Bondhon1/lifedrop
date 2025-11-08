"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { markNotificationRead } from "@/server/actions/notification";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNotificationClick = (notificationId: number, link: string | null | undefined) => {
    startTransition(async () => {
      try {
        // Mark as read
        const result = await markNotificationRead(notificationId);
        
        if (!result.ok) {
          console.error("Failed to mark notification as read:", result.message);
        }
        
        // Close the panel
        onClose?.();
        
        // Navigate to the link
        if (link && link.length > 0) {
          router.push(link);
        } else {
          router.push("/notifications");
        }
      } catch (error) {
        console.error("Error handling notification click:", error);
        onClose?.();
      }
    });
  };

  return (
    <div className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-soft bg-surface-card text-primary shadow-xl">
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
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
                className="group block w-full rounded-2xl border border-soft bg-[var(--color-surface-panel)] p-4 text-left text-sm transition-colors hover:border-[var(--color-primary-start)]/40 hover:bg-[var(--color-surface-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]"
              >
                <p className="text-sm font-semibold text-primary group-hover:text-primary">
                  {buildSnippet(notification.message)}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>{notification.senderName ?? "Community"}</span>
                  <span>{formatRelativeTime(notification.createdAt)}</span>
                </div>
              </button>
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
