"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSocket } from "@/components/providers/socket-provider";
import { Bell, ClipboardCheck, Droplets, LayoutDashboard, MessageCircle, Newspaper, ShieldCheck, User, UserPlus, Users } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

const baseLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["USER", "ADMIN"] as const },
  { href: "/feed", label: "News Feed", icon: Newspaper, roles: ["USER", "ADMIN"] as const },
  { href: "/requests", label: "Blood Requests", icon: Droplets, roles: ["USER", "ADMIN"] as const },
  { href: "/donors", label: "Donor Network", icon: Users, roles: ["USER", "ADMIN"] as const },
  { href: "/friends", label: "Friends", icon: UserPlus, roles: ["USER", "ADMIN"] as const },
  { href: "/chat", label: "Conversations", icon: MessageCircle, roles: ["USER", "ADMIN"] as const },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["USER", "ADMIN"] as const },
  { href: "/profile", label: "Profile", icon: User, roles: ["USER", "ADMIN"] as const },
];

const adminLinks = [
  { href: "/admin/overview", label: "Admin Console", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/admin/donors", label: "Donor Reviews", icon: ClipboardCheck, roles: ["ADMIN"] },
];

type AppShellProps = {
  user: SessionUser;
  children: ReactNode;
  unreadNotifications?: number;
};

export function AppShell({ user, children, unreadNotifications = 0 }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const socket = useSocket();
  const [notificationCount, setNotificationCount] = useState(unreadNotifications);
  const logoutHref = user.isAdmin ? "/admin-logout" : "/logout";

  useEffect(() => {
    setNotificationCount(unreadNotifications);
  }, [unreadNotifications]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNew = (payload: { unreadCount?: number } | undefined) => {
      if (typeof payload?.unreadCount === "number") {
        setNotificationCount(payload.unreadCount);
      } else {
        setNotificationCount((prev) => prev + 1);
      }
    };

    const handleUnreadCount = (payload: { unreadCount?: number } | undefined) => {
      if (typeof payload?.unreadCount === "number") {
        setNotificationCount(payload.unreadCount);
      }
    };

    const handleAllRead = (payload: { unreadCount?: number } | undefined) => {
      setNotificationCount(payload?.unreadCount ?? 0);
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:unread-count", handleUnreadCount);
    socket.on("notification:all-read", handleAllRead);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:unread-count", handleUnreadCount);
      socket.off("notification:all-read", handleAllRead);
    };
  }, [socket]);

  const links = user.isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <div className="grid w-full min-h-screen min-w-0 gap-6 grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="hidden h-full flex-col justify-between rounded-3xl border border-rose-500/20 bg-rose-950/70 p-6 shadow-2xl shadow-rose-900/40 backdrop-blur-2xl lg:flex">
        <div className="grid gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/40">
              <Droplets className="h-5 w-5" />
            </div>
            Lifedrop
          </Link>

          <nav className="grid gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const showNotificationBadge = link.href === "/notifications" && notificationCount > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-rose-500/25 text-white shadow-inner shadow-rose-500/20"
                      : "text-rose-100/70 hover:bg-rose-500/10 hover:text-white",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="flex-1">{link.label}</span>
                  {showNotificationBadge ? (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                      {Math.min(notificationCount, 99)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
            <Avatar src={undefined} alt={user.name ?? user.email ?? "User"} className="flex-shrink-0" />
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-white">{user.name ?? user.email ?? "Member"}</span>
              {user.role ? <Badge variant={user.isAdmin ? "secondary" : "default"}>{user.role}</Badge> : null}
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-rose-400/50 text-rose-50 hover:bg-rose-500/20"
          >
            <Link href={logoutHref}>Sign out</Link>
          </Button>
        </div>
      </aside>

      <div className="grid w-full min-w-0 gap-5">
        <header className="flex w-full flex-wrap items-center justify-between gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/70 px-5 py-4 shadow-2xl shadow-rose-900/40 backdrop-blur-2xl">
          <div className="grid gap-1">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-200">Welcome back</p>
            <h2 className="text-2xl font-semibold text-white leading-tight">
              {user.name ? `Ready to save lives, ${user.name}?` : "Let’s make a difference today"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" className="border border-rose-400/60 text-rose-50 hover:bg-rose-500/20" asChild>
              <Link href="/requests/new">Create Request</Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative text-rose-100 hover:bg-rose-500/10" asChild>
              <Link href="/notifications">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
                    {Math.min(notificationCount, 99)}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border border-rose-400/60 text-rose-50 hover:bg-rose-500/20"
              asChild
            >
              <Link href={logoutHref}>Sign out</Link>
            </Button>
            <Link
              href="/profile"
              className="rounded-full border border-transparent outline-none transition focus:border-rose-400/60 focus:ring-2 focus:ring-rose-400/30"
            >
              <Avatar src={undefined} alt={user.name ?? "Profile"} size="sm" className="cursor-pointer" />
            </Link>
          </div>
        </header>

        <nav className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto rounded-3xl border border-rose-500/20 bg-rose-950/70 p-3 shadow-lg shadow-rose-900/30 backdrop-blur-xl">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const showNotificationBadge = link.href === "/notifications" && notificationCount > 0;
              return (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                    isActive
                      ? "bg-rose-500 text-white shadow shadow-rose-500/40"
                      : "bg-rose-500/15 text-rose-100/80 hover:bg-rose-500/25 hover:text-white",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {showNotificationBadge ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow">
                      {Math.min(notificationCount, 99)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="grid w-full min-w-0 gap-5 [&>*]:w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
