"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { failure, success, type ActionState } from "./types";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetInput = z.infer<typeof resetSchema>;

type ResetResult = ActionState<{ userId: number }>;

type TokenRecord = {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
};

type UserRecord = {
  id: number;
  email: string;
};

async function findToken(token: string): Promise<TokenRecord | null> {
  return prisma.passwordResetToken.findUnique({ where: { token } });
}

async function deleteToken(id: number): Promise<void> {
  await prisma.passwordResetToken.delete({ where: { id } });
}

async function updateUserPassword(userId: number, password: string): Promise<UserRecord> {
  const hashed = await hashPassword(password);

  return prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
    select: {
      id: true,
      email: true,
    },
  });
}

export async function updatePasswordWithToken(input: ResetInput): Promise<ResetResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid reset request");
  }

  const record = await findToken(parsed.data.token);
  if (!record) {
    return failure("This reset link is no longer valid. Request a new one and try again.");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await deleteToken(record.id);
    return failure("This reset link has expired. Request a new one to continue.");
  }

  try {
    await updateUserPassword(record.userId, parsed.data.password);
  } catch (error) {
    console.error("updatePasswordWithToken:updateUserPassword", error);
    return failure("We couldn’t update your password. Please try again later.");
  }

  await deleteToken(record.id);
  revalidatePath("/login");

  return success({ userId: record.userId });
}
