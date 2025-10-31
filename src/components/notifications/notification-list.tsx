"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/notification";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";

export type NotificationViewModel = {
  id: number;
  message: string;
  createdAt: string;
  link?: string | null;
  senderName?: string | null;
  isRead: boolean;
};

type NotificationListProps = {
  notifications: NotificationViewModel[];
  unreadCount: number;
};

const formatRelative = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch (error) {
    console.error("NotificationList:formatRelative", error);
    return "Just now";
  }
};

export function NotificationList({ notifications, unreadCount }: NotificationListProps) {
  const [items, setItems] = useState(notifications);
  const [unread, setUnread] = useState(unreadCount);
  const [isPending, startTransition] = useTransition();
  const socket = useSocket();

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    setUnread(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNew = (payload: {
      notification?: {
        id: number;
        message: string;
        link?: string | null;
        isRead: boolean;
        createdAt: string;
        senderName?: string | null;
      };
      unreadCount?: number;
    }) => {
      if (!payload?.notification) {
        return;
      }

      const incoming: NotificationViewModel = {
        id: payload.notification.id,
        message: payload.notification.message,
        createdAt: payload.notification.createdAt,
        link: payload.notification.link ?? null,
        senderName: payload.notification.senderName ?? null,
        isRead: payload.notification.isRead,
      };

      setItems((prev) => {
        const exists = prev.some((item) => item.id === incoming.id);
        if (exists) {
          return prev.map((item) => (item.id === incoming.id ? incoming : item));
        }
        return [incoming, ...prev].slice(0, 100);
      });

      if (typeof payload.unreadCount === "number") {
        setUnread(payload.unreadCount);
      } else {
        setUnread((prev) => prev + (incoming.isRead ? 0 : 1));
      }
    };

    const handleUpdated = (payload: { notificationId?: number; isRead?: boolean }) => {
      if (typeof payload?.notificationId !== "number") {
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === payload.notificationId ? { ...item, isRead: payload.isRead ?? item.isRead } : item,
        ),
      );
    };

    const handleUnreadCount = (payload: { unreadCount?: number }) => {
      if (typeof payload?.unreadCount === "number") {
        setUnread(payload.unreadCount);
      }
    };

    const handleAllRead = (payload: { unreadCount?: number }) => {
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnread(payload?.unreadCount ?? 0);
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:unread-count", handleUnreadCount);
    socket.on("notification:all-read", handleAllRead);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:unread-count", handleUnreadCount);
      socket.off("notification:all-read", handleAllRead);
    };
  }, [socket]);

  const handleMarkAsRead = (notificationId: number) => {
    startTransition(async () => {
      const result = await markNotificationRead(notificationId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
      setUnread(result.data.unreadCount);
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnread(result.data.unreadCount);
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-rose-500/30 bg-rose-500/10 p-10 text-center text-sm text-rose-100/80">
        <Bell className="h-10 w-10 text-rose-300" />
        <p>No notifications yet.</p>
        <p className="text-xs text-rose-100/60">We&apos;ll let you know when there&apos;s an update that needs your attention.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-rose-100/80">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        <Button variant="secondary" size="sm" className="border border-rose-400/50" onClick={handleMarkAll} disabled={isPending || unread === 0}>
          Mark all as read
        </Button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const href = item.link ?? undefined;
          const relativeTime = formatRelative(item.createdAt);
          return (
            <div
              key={item.id}
              className={cn(
                "flex w-full flex-col gap-2 rounded-2xl border border-rose-500/20 bg-rose-950/70 p-4 shadow-lg transition",
                !item.isRead ? "border-rose-400/40 bg-rose-500/20 shadow-rose-900/30" : "shadow-rose-900/20",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-white">
                  {item.message}
                  {item.senderName ? <span className="text-rose-100/70"> · {item.senderName}</span> : null}
                </div>
                <span className="text-xs text-rose-100/60">{relativeTime}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-rose-100/75">
                {href ? (
                  <Link href={href} className="font-semibold text-rose-300 transition hover:text-rose-200">
                    View details
                  </Link>
                ) : (
                  <span className="text-rose-100/60">No link provided</span>
                )}
                {!item.isRead ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(item.id)}
                    disabled={isPending}
                    className="text-rose-100/80 hover:text-white"
                  >
                    Mark as read
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
