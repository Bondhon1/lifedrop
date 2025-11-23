"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn, resolveImageUrl } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSocket } from "@/components/providers/socket-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Bell,
  ClipboardCheck,
  Droplets,
  FileWarning,
  ListChecks,
  MessageCircle,
  Menu,
  Newspaper,
  Plus,
  ShieldCheck,
  User,
  UserCog,
  UserPlus,
  X,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { NotificationHoverPanel } from "@/components/navigation/notification-hover-panel";
import { ConversationHoverPanel } from "@/components/navigation/conversation-hover-panel";
import type { ConversationPreviewItem, NotificationPreviewItem } from "./app-shell.types";

const MAX_NOTIFICATION_PREVIEWS = 10;
const MAX_CONVERSATION_PREVIEWS = 10;

const baseLinks = [
  { href: "/feed", label: "News Feed", icon: Newspaper, roles: ["USER", "ADMIN"] as const },
  { href: "/requests", label: "Blood Requests", icon: Droplets, roles: ["USER", "ADMIN"] as const },
  { href: "/donors", label: "Donor Profile", icon: Users, roles: ["USER", "ADMIN"] as const },
  { href: "/friends", label: "Friends", icon: UserPlus, roles: ["USER", "ADMIN"] as const },
  { href: "/chat", label: "Conversations", icon: MessageCircle, roles: ["USER", "ADMIN"] as const },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["USER", "ADMIN"] as const },
  { href: "/profile", label: "Profile", icon: User, roles: ["USER", "ADMIN"] as const },
];

const adminSidebarExcludedLinks = new Set(["/feed", "/requests", "/donors", "/friends", "/chat", "/notifications", "/profile"]);

const adminLinks = [
  { href: "/admin/overview", label: "Admin Console", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/admin/donors", label: "Donor Reviews", icon: ClipboardCheck, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Member Directory", icon: ListChecks, roles: ["ADMIN"] },
  { href: "/admin/contact-messages", label: "Contact Messages", icon: MessageCircle, roles: ["ADMIN"] },
  { href: "/admin/reports", label: "Reports Queue", icon: FileWarning, roles: ["ADMIN"] },
  { href: "/admin/admins", label: "Admin Accounts", icon: UserCog, roles: ["ADMIN"] },
];

type AppShellProps = {
  user: SessionUser;
  children: ReactNode;
  unreadNotifications?: number;
  avatarUrl?: string | null;
  initialNotifications?: NotificationPreviewItem[];
  initialConversations?: ConversationPreviewItem[];
};

export function AppShell({
  user,
  children,
  unreadNotifications = 0,
  avatarUrl,
  initialNotifications = [],
  initialConversations = [],
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const socket = useSocket();
  const logoutHref = user.isAdmin ? "/admin-logout" : "/logout";

  const [notificationCount, setNotificationCount] = useState(unreadNotifications);
  const [notificationItems, setNotificationItems] = useState<NotificationPreviewItem[]>(
    initialNotifications.slice(0, MAX_NOTIFICATION_PREVIEWS),
  );
  const [conversationItems, setConversationItems] = useState<ConversationPreviewItem[]>(
    initialConversations.slice(0, MAX_CONVERSATION_PREVIEWS),
  );
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showConversationsPanel, setShowConversationsPanel] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const currentUserId = useMemo(() => {
    const rawId = user.id;
    if (!rawId) {
      return null;
    }

    if (typeof rawId === "string") {
      if (rawId.startsWith("admin:")) {
        const parsed = Number(rawId.split(":")[1]);
        return Number.isInteger(parsed) ? parsed : null;
      }
      const parsed = Number(rawId);
      return Number.isInteger(parsed) ? parsed : null;
    }

    if (typeof rawId === "number" && Number.isInteger(rawId)) {
      return rawId;
    }

    return null;
  }, [user.id]);

  const conversationUnreadTotal = useMemo(
    () => conversationItems.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
    [conversationItems],
  );

  useEffect(() => {
    setNotificationCount(unreadNotifications);
  }, [unreadNotifications]);

  useEffect(() => {
    setNotificationItems(initialNotifications.slice(0, MAX_NOTIFICATION_PREVIEWS));
  }, [initialNotifications]);

  useEffect(() => {
    setConversationItems(initialConversations.slice(0, MAX_CONVERSATION_PREVIEWS));
  }, [initialConversations]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNew = (
      payload:
        | {
            notification?: {
              id: number;
              message: string;
              link?: string | null;
              isRead: boolean;
              createdAt: string;
              senderName?: string | null;
            };
            unreadCount?: number;
          }
        | undefined,
    ) => {
      if (payload?.notification) {
        const incoming: NotificationPreviewItem = {
          id: payload.notification.id,
          message: payload.notification.message,
          link: payload.notification.link ?? null,
          isRead: payload.notification.isRead,
          createdAt: payload.notification.createdAt,
          senderName: payload.notification.senderName ?? null,
        };

        setNotificationItems((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === incoming.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = incoming;
            return updated;
          }
          return [incoming, ...prev].slice(0, MAX_NOTIFICATION_PREVIEWS);
        });
      }

      if (typeof payload?.unreadCount === "number") {
        setNotificationCount(payload.unreadCount);
      } else if (!payload?.notification?.isRead) {
        setNotificationCount((prev) => prev + 1);
      }
    };

    const handleUpdated = (payload: { notificationId?: number; isRead?: boolean } | undefined) => {
      if (typeof payload?.notificationId !== "number") {
        return;
      }
      setNotificationItems((prev) =>
        prev.map((item) =>
          item.id === payload.notificationId ? { ...item, isRead: payload.isRead ?? item.isRead } : item,
        ),
      );
    };

    const handleUnreadCount = (payload: { unreadCount?: number } | undefined) => {
      if (typeof payload?.unreadCount === "number") {
        setNotificationCount(payload.unreadCount);
      }
    };

    const handleAllRead = (payload: { unreadCount?: number } | undefined) => {
      setNotificationItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setNotificationCount(payload?.unreadCount ?? 0);
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

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewMessage = (
      payload:
        | {
            content?: string;
            createdAt?: string;
            senderId?: number;
            receiverId?: number;
            partner?: {
              id: number;
              username: string;
              name?: string | null;
              profilePicture?: string | null;
            };
            unreadFromPartner?: number;
          }
        | undefined,
    ) => {
      if (!payload?.partner) {
        return;
      }

      const partner = payload.partner;

      setConversationItems((prev) => {
        const partnerId = partner.id;
        const existing = prev.find((item) => item.partnerId === partnerId);

        const computedUnread = typeof payload.unreadFromPartner === "number"
          ? payload.unreadFromPartner
          : payload.senderId && payload.senderId !== currentUserId
            ? (existing?.unreadCount ?? 0) + 1
            : existing?.unreadCount ?? 0;

        const partnerAvatar = partner.profilePicture ?? existing?.partnerAvatar ?? null;

        const nextItem: ConversationPreviewItem = {
          partnerId,
          partnerName: partner.name ?? partner.username,
          partnerUsername: partner.username,
          partnerAvatar,
          lastMessage: payload.content ?? existing?.lastMessage ?? "",
          lastMessageAt: payload.createdAt ?? existing?.lastMessageAt ?? new Date().toISOString(),
          lastSenderId: payload.senderId ?? existing?.lastSenderId ?? currentUserId ?? 0,
          unreadCount: computedUnread,
        };

        const others = prev.filter((item) => item.partnerId !== partnerId);
  return [nextItem, ...others].slice(0, MAX_CONVERSATION_PREVIEWS);
      });
    };

    const handleConversationRead = (payload: { partnerId?: number } | undefined) => {
      if (typeof payload?.partnerId !== "number") {
        return;
      }
      setConversationItems((prev) =>
        prev.map((item) => (item.partnerId === payload.partnerId ? { ...item, unreadCount: 0 } : item)),
      );
    };

    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:conversation-read", handleConversationRead);

    return () => {
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:conversation-read", handleConversationRead);
    };
  }, [socket, currentUserId]);

  const links = user.isAdmin
    ? [...baseLinks.filter((link) => !adminSidebarExcludedLinks.has(link.href)), ...adminLinks]
    : baseLinks;
  const resolvedAvatar = resolveImageUrl(avatarUrl ?? user.image ?? null);

  return (
    <div className="grid w-full min-h-screen min-w-0 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="hidden h-full flex-col justify-between rounded-3xl border border-soft bg-surface-sidebar p-6 text-primary shadow-soft lg:flex">
        <div className="grid gap-6">
          <Link href="/feed" className="flex items-center gap-3 text-lg font-semibold text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary bg-surface-card text-[var(--color-text-danger)] shadow-soft">
              <Droplets className="h-5 w-5" />
            </div>
            Lifedrop
          </Link>

          <nav className="grid gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const badgeValue = link.href === "/notifications"
                ? notificationCount
                : link.href === "/chat"
                  ? conversationUnreadTotal
                  : 0;
              const showBadge = badgeValue > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-[var(--color-surface-primary-soft)] text-primary shadow-soft"
                      : "bg-transparent text-secondary hover:bg-[var(--color-surface-primary-soft)] hover:text-primary",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="flex-1">{link.label}</span>
                  {showBadge ? (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[var(--color-primary-start)] px-1 text-xs font-bold text-white">
                      {Math.min(badgeValue, 99)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-subtle bg-surface-card p-4 shadow-soft">
            <Avatar src={resolvedAvatar ?? undefined} alt={user.name ?? user.email ?? "User"} className="flex-shrink-0" />
            <div className="grid gap-1 min-w-0 flex-1">
              <span className="text-sm font-semibold text-primary truncate">{user.name ?? user.email ?? "Member"}</span>
              {user.role ? <Badge variant={user.isAdmin ? "secondary" : "default"} className="w-fit">{user.role}</Badge> : null}
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full border-transparent bg-[var(--color-primary-start)] text-white hover:bg-[var(--color-primary-end)] hover:text-white focus-visible:text-white"
          >
            <Link href={logoutHref}>Sign out</Link>
          </Button>
        </div>
      </aside>

    <div className="grid w-full min-w-0 gap-5 px-4 pb-6 sm:px-6 lg:px-0">
        <header className="flex w-full flex-wrap items-center justify-between gap-4 rounded-3xl border border-soft bg-surface-card px-5 py-4 shadow-soft">
          <div className="flex w-full flex-1 items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-1 lg:hidden"
                aria-label="Open navigation"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="grid gap-1">
                <p className="text-xs uppercase tracking-[0.35em] text-accent">Welcome back</p>
                <h2 className="text-2xl font-semibold text-primary leading-tight">
                  {user.name ? `Ready to save lives, ${user.name}?` : "Let’s make a difference today"}
                </h2>
              </div>
            </div>
            <div className="hidden flex-shrink-0 items-center gap-3 lg:flex">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/requests/new">Create Request</Link>
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-haspopup="dialog"
                  aria-expanded={showNotificationsPanel}
                  onMouseEnter={() => {
                    setShowNotificationsPanel(true);
                    setShowConversationsPanel(false);
                  }}
                  onClick={() => {
                    setShowNotificationsPanel((prev) => {
                      const next = !prev;
                      if (next) {
                        setShowConversationsPanel(false);
                      }
                      return next;
                    });
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-primary-start)] px-1 text-[10px] font-bold text-white shadow">
                      {Math.min(notificationCount, 99)}
                    </span>
                  ) : null}
                </Button>
                {showNotificationsPanel ? (
                  <div
                    className="absolute right-0 z-40 mt-2"
                    onMouseEnter={() => setShowNotificationsPanel(true)}
                    onMouseLeave={() => setShowNotificationsPanel(false)}
                  >
                    <NotificationHoverPanel
                      notifications={notificationItems}
                      unreadCount={notificationCount}
                      onClose={() => setShowNotificationsPanel(false)}
                    />
                  </div>
                ) : null}
              </div>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-haspopup="dialog"
                  aria-expanded={showConversationsPanel}
                  onMouseEnter={() => {
                    setShowConversationsPanel(true);
                    setShowNotificationsPanel(false);
                  }}
                  onClick={() => {
                    setShowConversationsPanel((prev) => {
                      const next = !prev;
                      if (next) {
                        setShowNotificationsPanel(false);
                      }
                      return next;
                    });
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {conversationUnreadTotal > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow">
                      {Math.min(conversationUnreadTotal, 99)}
                    </span>
                  ) : null}
                </Button>
                {showConversationsPanel ? (
                  <div
                    className="absolute right-0 z-40 mt-2"
                    onMouseEnter={() => setShowConversationsPanel(true)}
                    onMouseLeave={() => setShowConversationsPanel(false)}
                  >
                    <ConversationHoverPanel
                      conversations={conversationItems}
                      currentUserId={currentUserId}
                      onClose={() => setShowConversationsPanel(false)}
                    />
                  </div>
                ) : null}
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" asChild>
                <Link href={logoutHref}>Sign out</Link>
              </Button>
              <Link
                href="/profile"
                className="rounded-full border border-transparent outline-none transition focus:border-primary focus:ring-2 focus:ring-[var(--ring-primary)]"
              >
                <Avatar src={resolvedAvatar ?? undefined} alt={user.name ?? "Profile"} size="sm" className="cursor-pointer" />
              </Link>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 lg:hidden">
            <Button variant="secondary" size="icon" asChild>
              <Link href="/requests/new" aria-label="Create request">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-haspopup="dialog"
                aria-expanded={showNotificationsPanel}
                onClick={() => {
                  setShowNotificationsPanel((prev) => {
                    const next = !prev;
                    if (next) {
                      setShowConversationsPanel(false);
                    }
                    return next;
                  });
                }}
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-primary-start)] px-1 text-[10px] font-bold text-white shadow">
                    {Math.min(notificationCount, 99)}
                  </span>
                ) : null}
              </Button>
              {showNotificationsPanel ? (
                <div
                  className="absolute left-0 right-0 top-full z-40 mx-auto mt-2 w-[min(22rem,calc(100vw-2rem))] sm:left-auto sm:right-0 sm:w-auto"
                  onMouseLeave={() => setShowNotificationsPanel(false)}
                >
                  <NotificationHoverPanel
                    notifications={notificationItems}
                    unreadCount={notificationCount}
                    onClose={() => setShowNotificationsPanel(false)}
                  />
                </div>
              ) : null}
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-haspopup="dialog"
                aria-expanded={showConversationsPanel}
                onClick={() => {
                  setShowConversationsPanel((prev) => {
                    const next = !prev;
                    if (next) {
                      setShowNotificationsPanel(false);
                    }
                    return next;
                  });
                }}
              >
                <MessageCircle className="h-4 w-4" />
                {conversationUnreadTotal > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow">
                    {Math.min(conversationUnreadTotal, 99)}
                  </span>
                ) : null}
              </Button>
              {showConversationsPanel ? (
                <div
                  className="absolute left-0 right-0 top-full z-40 mx-auto mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-10"
                  onMouseLeave={() => setShowConversationsPanel(false)}
                >
                  <ConversationHoverPanel
                    conversations={conversationItems}
                    currentUserId={currentUserId}
                    onClose={() => setShowConversationsPanel(false)}
                  />
                </div>
              ) : null}
            </div>
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href={logoutHref}>Sign out</Link>
            </Button>
            <Link
              href="/profile"
              className="rounded-full border border-transparent outline-none transition focus:border-primary focus:ring-2 focus:ring-[var(--ring-primary)]"
            >
              <Avatar src={resolvedAvatar ?? undefined} alt={user.name ?? "Profile"} size="sm" className="cursor-pointer" />
            </Link>
          </div>
        </header>

        <main className="grid w-full min-w-0 gap-5 [&>*]:w-full">
          {children}
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col gap-6 overflow-y-auto rounded-tr-3xl rounded-br-3xl border border-soft border-l-0 bg-surface-sidebar p-6 text-primary shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <Link href="/feed" className="flex items-center gap-3 text-lg font-semibold text-primary" onClick={() => setIsMobileNavOpen(false)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary bg-surface-card text-[var(--color-text-danger)] shadow-soft">
                  <Droplets className="h-4 w-4" />
                </div>
                Lifedrop
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="grid gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const badgeValue = link.href === "/notifications"
                  ? notificationCount
                  : link.href === "/chat"
                    ? conversationUnreadTotal
                    : 0;
                const showBadge = badgeValue > 0;
                return (
                  <Link
                    key={`drawer-${link.href}`}
                    href={link.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-[var(--color-surface-primary-soft)] text-primary shadow-soft"
                        : "bg-transparent text-secondary hover:bg-[var(--color-surface-primary-soft)] hover:text-primary",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="flex-1">{link.label}</span>
                    {showBadge ? (
                      <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[var(--color-primary-start)] px-1 text-xs font-bold text-white">
                        {Math.min(badgeValue, 99)}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-subtle bg-surface-card p-4 shadow-soft">
                <Avatar src={resolvedAvatar ?? undefined} alt={user.name ?? user.email ?? "User"} className="flex-shrink-0" />
                <div className="grid gap-1 min-w-0 flex-1">
                  <span className="text-sm font-semibold text-primary truncate">{user.name ?? user.email ?? "Member"}</span>
                  {user.role ? <Badge variant={user.isAdmin ? "secondary" : "default"} className="w-fit">{user.role}</Badge> : null}
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full border-transparent bg-[var(--color-primary-start)] text-white hover:bg-[var(--color-primary-end)] hover:text-white focus-visible:text-white"
              >
                <Link href={logoutHref}>Sign out</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
