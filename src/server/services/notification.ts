import { prisma } from "@/lib/prisma";
import { publishToUser } from "@/lib/realtime";

export type CreateNotificationParams = {
  message: string;
  link?: string | null;
  recipientId?: number | null;
  adminRecipientId?: number | null;
  senderId?: number | null;
};

export async function createNotification(params: CreateNotificationParams) {
  const { message, link, recipientId, adminRecipientId, senderId } = params;

  if (!recipientId && !adminRecipientId) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      message,
      link: link ?? null,
      recipientId: recipientId ?? null,
      adminRecipientId: adminRecipientId ?? null,
      senderId: senderId ?? null,
    },
    select: {
      id: true,
      message: true,
      link: true,
      isRead: true,
      createdAt: true,
      recipientId: true,
      sender: {
        select: {
          username: true,
          name: true,
        },
      },
    },
  });

  if (notification.recipientId) {
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: notification.recipientId,
        isRead: false,
      },
    });

    void publishToUser(notification.recipientId, "notification:new", {
      notification: {
        id: notification.id,
        message: notification.message,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        senderName: notification.sender?.name ?? notification.sender?.username ?? null,
      },
      unreadCount,
    });
  }

  return notification;
}
