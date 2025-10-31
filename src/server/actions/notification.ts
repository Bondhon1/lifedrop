'use server';

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-server";
import { failure, success, type ActionState } from "./types";

const ensureAuthenticatedUser = async () => {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id);

  if (!userId || Number.isNaN(userId)) {
    return { userId: null } as const;
  }

  return {
    userId,
  } as const;
};

const revalidateNotificationViews = () => {
  ["/notifications", "/dashboard", "/feed", "/requests"].forEach((path) => revalidatePath(path));
};

export async function markNotificationRead(notificationId: number): Promise<ActionState<{ unreadCount: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to manage notifications.");
  }

  if (!Number.isInteger(notificationId)) {
    return failure("Invalid notification identifier.");
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: authResult.userId,
    },
    data: {
      isRead: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      recipientId: authResult.userId,
      isRead: false,
    },
  });

  emitToUser(authResult.userId, "notification:updated", {
    notificationId,
    isRead: true,
  });

  emitToUser(authResult.userId, "notification:unread-count", {
    unreadCount,
  });

  revalidateNotificationViews();

  return success({ unreadCount });
}

export async function markAllNotificationsRead(): Promise<ActionState<{ unreadCount: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to manage notifications.");
  }

  await prisma.notification.updateMany({
    where: {
      recipientId: authResult.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  emitToUser(authResult.userId, "notification:all-read", {
    unreadCount: 0,
  });

  revalidateNotificationViews();

  return success({ unreadCount: 0 });
}
