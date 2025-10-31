"use server";

import { revalidatePath } from "next/cache";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification";
import { failure, success, type ActionState } from "./types";

async function requireUser() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id);

  if (!sessionUser || !Number.isInteger(userId)) {
    return null;
  }

  return { userId, sessionUser };
}

const REVALIDATE = ["/friends", "/chat", "/dashboard"];

export async function sendFriendRequest(targetUserId: number): Promise<ActionState<{ requestId: number }>> {
  const context = await requireUser();
  if (!context) {
    return failure("You must be signed in to send friend requests.");
  }

  if (!Number.isInteger(targetUserId) || targetUserId === context.userId) {
    return failure("Invalid recipient.");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return failure("That member could not be found.");
  }

  const existingFriend = await prisma.userFriend.findUnique({
    where: {
      userId_friendId: {
        userId: context.userId,
        friendId: targetUserId,
      },
    },
  });

  if (existingFriend) {
    return failure("You are already connected.");
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: context.userId, receiverId: targetUserId, status: "pending" },
        { senderId: targetUserId, receiverId: context.userId, status: "pending" },
      ],
    },
  });

  if (existingRequest) {
    return failure("A pending request already exists.");
  }

  const request = await prisma.friendRequest.create({
    data: {
      senderId: context.userId,
      receiverId: targetUserId,
      status: "pending",
    },
    select: { id: true },
  });

  await createNotification({
    recipientId: targetUserId,
    senderId: context.userId,
    message: `${context.sessionUser.name ?? context.sessionUser.email ?? "A member"} sent you a friend request.`,
    link: "/friends",
  });

  REVALIDATE.forEach((path) => revalidatePath(path));

  return success({ requestId: request.id });
}

export async function cancelFriendRequest(requestId: number): Promise<ActionState<{ cancelled: boolean }>> {
  const context = await requireUser();
  if (!context) {
    return failure("You must be signed in to manage friend requests.");
  }

  if (!Number.isInteger(requestId)) {
    return failure("Invalid request.");
  }

  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.senderId !== context.userId) {
    return failure("You can only cancel your own pending requests.");
  }

  if (request.status !== "pending") {
    return failure("This request has already been processed.");
  }

  await prisma.friendRequest.delete({ where: { id: requestId } });
  REVALIDATE.forEach((path) => revalidatePath(path));
  return success({ cancelled: true });
}

export async function respondToFriendRequest(requestId: number, action: "accept" | "decline"): Promise<ActionState<{ status: string }>> {
  const context = await requireUser();
  if (!context) {
    return failure("You must be signed in to manage friend requests.");
  }

  if (!Number.isInteger(requestId)) {
    return failure("Invalid request.");
  }

  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.receiverId !== context.userId) {
    return failure("We couldn’t find that request.");
  }

  if (request.status !== "pending") {
    return failure("This request has already been processed.");
  }

  if (action === "decline") {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "declined" },
    });
    REVALIDATE.forEach((path) => revalidatePath(path));
    return success({ status: "declined" });
  }

  await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    }),
    prisma.userFriend.create({
      data: {
        userId: context.userId,
        friendId: request.senderId,
      },
    }),
    prisma.userFriend.create({
      data: {
        userId: request.senderId,
        friendId: context.userId,
      },
    }),
  ]);

  await createNotification({
    recipientId: request.senderId,
    senderId: context.userId,
    message: `${context.sessionUser.name ?? context.sessionUser.email ?? "A member"} accepted your friend request.`,
    link: "/friends",
  });

  REVALIDATE.forEach((path) => revalidatePath(path));
  return success({ status: "accepted" });
}

export async function removeFriend(friendId: number): Promise<ActionState<{ removed: boolean }>> {
  const context = await requireUser();
  if (!context) {
    return failure("You must be signed in to manage your connections.");
  }

  if (!Number.isInteger(friendId) || friendId === context.userId) {
    return failure("Invalid friend identifier.");
  }

  await prisma.$transaction([
    prisma.userFriend.deleteMany({
      where: {
        userId: context.userId,
        friendId,
      },
    }),
    prisma.userFriend.deleteMany({
      where: {
        userId: friendId,
        friendId: context.userId,
      },
    }),
  ]);

  REVALIDATE.forEach((path) => revalidatePath(path));
  return success({ removed: true });
}
