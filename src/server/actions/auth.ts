"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { registerUserSchema } from "@/lib/validators/user";
import { issueEmailVerification } from "@/server/services/email-verification";
import { failure, success, type ActionState } from "./types";
import { z } from "zod";
import crypto from "node:crypto";

export async function registerUser(formData: FormData): Promise<ActionState<{ id: number }>> {
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  };

  const parsed = registerUserSchema.safeParse(payload);
  if (!parsed.success) {
    return failure(
      "Please fix the highlighted errors and try again.",
      parsed.error.issues.map((issue) => issue.message),
    );
  }

  const { username, email, password, name } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    },
  });

  if (existing) {
    return failure("That email or username is already registered.");
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashed,
      name,
    },
    select: { id: true, email: true, name: true, username: true },
  });

  try {
    await issueEmailVerification({
      email: user.email,
      name: user.name,
      username: user.username,
    });
  } catch (error) {
    console.error("registerUser:issueEmailVerification", error);
  }

  return success({ id: user.id });
}

const resetRequestSchema = z.object({ email: z.string().email() });

export async function createPasswordReset(email: string): Promise<ActionState<{ token: string }>> {
  const parsed = resetRequestSchema.safeParse({ email });
  if (!parsed.success) {
    return failure("Please enter a valid email address.");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return failure("We couldn’t find an account with that email.");
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  const token = crypto.randomUUID();

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
  });

  return success({ token });

}







