'use server';

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validators/chat";
import { publishToUser } from "@/lib/realtime";
import { failure, success, type ActionState } from "./types";

const REVALIDATE_PATHS = ["/chat"];

const ensureAuthenticatedUser = async () => {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id);

  if (!userId || Number.isNaN(userId)) {
    return { userId: null } as const;
  }

  return {
    userId,
    sessionUser,
  } as const;
};

const revalidateChatViews = () => {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
};

export async function sendChatMessage(formData: FormData): Promise<ActionState<{ id: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to send messages.");
  }

  const rawInput = {
    receiverId: Number(formData.get("receiverId")),
    text: formData.get("text"),
  };

  const parsed = chatMessageSchema.safeParse(rawInput);
  if (!parsed.success) {
    return failure("Check your message.", parsed.error.issues.map((issue) => issue.message));
  }

  const values = parsed.data;

  if (values.receiverId === authResult.userId) {
    return failure("You can’t message yourself.");
  }

  const friendship = await prisma.userFriend.findFirst({
    where: {
      OR: [
        {
          userId: authResult.userId,
          friendId: values.receiverId,
        },
        {
          userId: values.receiverId,
          friendId: authResult.userId,
        },
      ],
    },
  });

  if (!friendship) {
    return failure("You can only message confirmed connections.");
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        content: values.text,
        senderId: authResult.userId,
        receiverId: values.receiverId,
        imageUrls: [],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
          },
        },
      },
    });

    await prisma.chatMessage.updateMany({
      where: {
        senderId: authResult.userId,
        receiverId: values.receiverId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const receiverUnreadFromSender = await prisma.chatMessage.count({
      where: {
        senderId: authResult.userId,
        receiverId: values.receiverId,
        isRead: false,
      },
    });

    const receiverTotalUnread = await prisma.chatMessage.count({
      where: {
        receiverId: values.receiverId,
        isRead: false,
      },
    });

    const senderPartnerPayload = {
      id: message.receiver.id,
      username: message.receiver.username,
      name: message.receiver.name,
      bloodGroup: message.receiver.bloodGroup,
    } as const;

    const receiverPartnerPayload = {
      id: message.sender.id,
      username: message.sender.username,
      name: message.sender.name,
      bloodGroup: message.sender.bloodGroup,
    } as const;

    void publishToUser(values.receiverId, "chat:new-message", {
      id: message.id,
      content: values.text,
      createdAt: message.createdAt.toISOString(),
      senderId: authResult.userId,
      receiverId: values.receiverId,
      partner: receiverPartnerPayload,
      unreadFromPartner: receiverUnreadFromSender,
      totalUnread: receiverTotalUnread,
    });

    void publishToUser(authResult.userId, "chat:new-message", {
      id: message.id,
      content: values.text,
      createdAt: message.createdAt.toISOString(),
      senderId: authResult.userId,
      receiverId: values.receiverId,
      partner: senderPartnerPayload,
      unreadFromPartner: 0,
    });

    revalidateChatViews();

    return success({ id: message.id });
  } catch (error) {
    console.error("sendChatMessage:error", error);
    return failure("We couldn’t deliver that message. Please try again.");
  }
}

export async function markConversationRead(partnerId: number): Promise<ActionState<{ unreadCount: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to continue.");
  }

  if (!Number.isInteger(partnerId)) {
    return failure("Invalid conversation identifier.");
  }

  await prisma.chatMessage.updateMany({
    where: {
      senderId: partnerId,
      receiverId: authResult.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  const unreadCount = await prisma.chatMessage.count({
    where: {
      receiverId: authResult.userId,
      isRead: false,
    },
  });

  void publishToUser(authResult.userId, "chat:conversation-read", {
    partnerId,
    totalUnread: unreadCount,
  });

  revalidateChatViews();

  return success({ unreadCount });
}
