'use server';

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validators/comment";
import { createNotification } from "@/server/services/notification";
import { failure, success, type ActionState } from "./types";

const SHARED_REVALIDATE_PATHS = ["/feed", "/requests", "/notifications"];

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

const revalidateForRequest = (requestId: number) => {
  SHARED_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath(`/requests/${requestId}`);
};

export type CommentViewModel = {
  id: number;
  text: string;
  createdAt: string;
  likeCount: number;
  likedByViewer: boolean;
  author: {
    id: number;
    username: string;
    name: string | null;
    bloodGroup: string | null;
  };
};

export async function createComment(formData: FormData): Promise<ActionState<CommentViewModel>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to comment.");
  }

  const rawInput = {
    requestId: Number(formData.get("requestId")),
    text: formData.get("text"),
  };

  const parsed = commentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return failure("Please enter a message.", parsed.error.issues.map((issue) => issue.message));
  }

  const values = parsed.data;

  const request = await prisma.bloodRequest.findUnique({
    where: { id: values.requestId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!request) {
    return failure("We could not find that request.");
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        text: values.text,
        bloodRequestId: values.requestId,
        userId: authResult.userId,
      },
      select: {
        id: true,
        createdAt: true,
        text: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
          },
        },
      },
    });

    if (request.userId !== authResult.userId) {
      const actorName = authResult.sessionUser?.name ?? authResult.sessionUser?.email ?? comment.user.username;
      await createNotification({
        recipientId: request.userId,
        senderId: authResult.userId,
        message: `${actorName} commented on your blood request`,
        link: `/requests/${request.id}`,
      });
    }

    revalidateForRequest(request.id);

    return success({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      likeCount: 0,
      likedByViewer: false,
      author: {
        id: comment.user.id,
        username: comment.user.username,
        name: comment.user.name,
        bloodGroup: comment.user.bloodGroup,
      },
    });
  } catch (error) {
    console.error("createComment:error", error);
    return failure("We could not post your comment. Please try again.");
  }
}

export async function toggleCommentLike(commentId: number): Promise<ActionState<{ likeCount: number; liked: boolean }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to like a comment.");
  }

  if (!Number.isInteger(commentId)) {
    return failure("Invalid comment identifier.");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      bloodRequestId: true,
      userId: true,
    },
  });

  if (!comment) {
    return failure("That comment no longer exists.");
  }

  try {
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: authResult.userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      await prisma.commentLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.commentLike.create({
        data: {
          userId: authResult.userId,
          commentId,
        },
      });

      if (comment.userId !== authResult.userId) {
        const actorName = authResult.sessionUser?.name ?? authResult.sessionUser?.email ?? "A community member";
        await createNotification({
          recipientId: comment.userId,
          senderId: authResult.userId,
          message: `${actorName} reacted to your comment`,
          link: `/requests/${comment.bloodRequestId}`,
        });
      }
    }

    const likeCount = await prisma.commentLike.count({ where: { commentId } });

    revalidateForRequest(comment.bloodRequestId);

    return success({ likeCount, liked: !existingLike });
  } catch (error) {
    console.error("toggleCommentLike:error", error);
    return failure("We could not update the reaction right now.");
  }
}
