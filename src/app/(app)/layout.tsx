import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import type { ConversationPreviewItem, NotificationPreviewItem } from "@/components/layout/app-shell.types";
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
  let initialNotifications: NotificationPreviewItem[] = [];
  let initialConversations: ConversationPreviewItem[] = [];

  if (safeUserId !== null) {
    try {
      const [notificationCount, profileRecord, recentNotifications, recentMessages, unreadGroups] = await Promise.all([
        prisma.notification.count({ where: { recipientId: safeUserId, isRead: false } }),
        profileImage
          ? Promise.resolve(null)
          : prisma.user.findUnique({ where: { id: safeUserId }, select: { profilePicture: true } }),
        prisma.notification.findMany({
          where: { recipientId: safeUserId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            message: true,
            link: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        }),
        prisma.chatMessage.findMany({
          where: {
            OR: [
              { senderId: safeUserId },
              { receiverId: safeUserId },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            receiverId: true,
            sender: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePicture: true,
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        }),
        prisma.chatMessage.groupBy({
          by: ["senderId"],
          where: {
            receiverId: safeUserId,
            isRead: false,
          },
          _count: {
            _all: true,
          },
        }),
      ]);

      unreadNotifications = notificationCount;
      if (!profileImage && profileRecord?.profilePicture) {
        profileImage = profileRecord.profilePicture;
      }

      initialNotifications = recentNotifications.map((notification) => ({
        id: notification.id,
        message: notification.message,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        senderName: notification.sender?.name ?? notification.sender?.username ?? null,
      }));

      const unreadLookup = new Map<number, number>();
      unreadGroups.forEach((group) => {
        if (typeof group.senderId === "number") {
          unreadLookup.set(group.senderId, group._count._all ?? 0);
        }
      });

      const conversationMap = new Map<number, ConversationPreviewItem>();
      for (const message of recentMessages) {
        const isSender = message.senderId === safeUserId;
        const partner = isSender ? message.receiver : message.sender;
        if (!partner) {
          continue;
        }

        if (conversationMap.has(partner.id)) {
          continue;
        }

        conversationMap.set(partner.id, {
          partnerId: partner.id,
          partnerName: partner.name ?? partner.username,
          partnerUsername: partner.username,
          partnerAvatar: partner.profilePicture ?? null,
          lastMessage: message.content,
          lastMessageAt: message.createdAt.toISOString(),
          lastSenderId: message.senderId,
          unreadCount: unreadLookup.get(partner.id) ?? 0,
        });
      }

  initialConversations = Array.from(conversationMap.values()).slice(0, 10);
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
      <AppShell
        user={user}
        unreadNotifications={unreadNotifications}
        avatarUrl={profileImage}
        initialNotifications={initialNotifications}
        initialConversations={initialConversations}
      >
        {children}
      </AppShell>
    </SocketProvider>
  );
}
