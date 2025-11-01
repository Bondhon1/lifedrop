import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { SocketProvider } from "@/components/providers/socket-provider";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isDatabaseUnavailableError(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P1001";
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  const userId = Number(user.id);
  const safeUserId = Number.isInteger(userId) ? userId : null;

  let unreadNotifications = 0;
  let profileImage: string | null = typeof user.image === "string" && user.image.length > 0 ? user.image : null;

  if (safeUserId !== null) {
    try {
      const [notificationCount, profileRecord] = await Promise.all([
        prisma.notification.count({ where: { recipientId: safeUserId, isRead: false } }),
        profileImage
          ? Promise.resolve(null)
          : prisma.user.findUnique({ where: { id: safeUserId }, select: { profilePicture: true } }),
      ]);

      unreadNotifications = notificationCount;
      if (!profileImage && profileRecord?.profilePicture) {
        profileImage = profileRecord.profilePicture;
      }
    } catch (error: unknown) {
      if (isDatabaseUnavailableError(error)) {
        console.error("Database is unavailable while loading notification count. Rendering fallback.", error);
      } else {
        throw error;
      }
    }
  }

  return (
    <SocketProvider userId={safeUserId}>
      <AppShell user={user} unreadNotifications={unreadNotifications} avatarUrl={profileImage}>
        {children}
      </AppShell>
    </SocketProvider>
  );
}
