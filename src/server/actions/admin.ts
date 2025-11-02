"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { failure, success, type ActionState } from "./types";

const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Choose an admin username with at least 3 characters.")
    .max(32, "Admin usernames cannot exceed 32 characters.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use only letters, numbers, dots, dashes, or underscores."),
  email: z
    .string()
    .trim()
    .email("Provide a valid admin email address.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Set a password with at least 8 characters."),
});

const idSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isInteger(parsed) ? parsed : NaN;
  })
  .refine((value) => Number.isInteger(value) && value > 0, {
    message: "Invalid identifier provided.",
  });

async function getAdminSession(): Promise<{ adminId: number; user: SessionUser } | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser?.isAdmin) {
    return null;
  }

  const adminId = typeof sessionUser.id === "string" && sessionUser.id.startsWith("admin:")
    ? Number(sessionUser.id.split(":")[1])
    : Number(sessionUser.id);

  if (!Number.isInteger(adminId)) {
    return null;
  }

  return { adminId, user: sessionUser };
}

function revalidateAdminPaths(paths: readonly string[]) {
  paths.forEach((path) => revalidatePath(path));
}

export async function createAdminAccount(formData: FormData): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await getAdminSession();
  if (!sessionInfo) {
    return failure("Only admins can create new administrator accounts.");
  }

  const payload = createAdminSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    const message = payload.error.issues[0]?.message ?? "Review the form fields and try again.";
    return failure(message);
  }

  const { username, email, password } = payload.data;

  const existing = await prisma.admin.findFirst({
    where: {
      OR: [{ username: username.toLowerCase() }, { email }],
    },
    select: { id: true },
  });

  if (existing) {
    return failure("That admin username or email is already in use.");
  }

  const hashed = await hashPassword(password);

  try {
    await prisma.admin.create({
      data: {
        username: username.toLowerCase(),
        email,
        password: hashed,
      },
    });
  } catch (error) {
    console.error("createAdminAccount", error);
    return failure("We couldn’t create that admin account right now. Please try again.");
  }

  revalidateAdminPaths(["/admin/overview", "/admin/admins"]);

  return success({ message: "New admin account created successfully." });
}

export async function deleteAdminAccount(adminId: number | string): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await getAdminSession();
  if (!sessionInfo) {
    return failure("Only admins can manage administrator accounts.");
  }

  const parsedId = idSchema.safeParse(adminId);
  if (!parsedId.success) {
    return failure(parsedId.error.issues[0]?.message ?? "Invalid admin reference.");
  }

  if (parsedId.data === sessionInfo.adminId) {
    return failure("You cannot remove the account you are currently using.");
  }

  const totalAdmins = await prisma.admin.count();
  if (totalAdmins <= 1) {
    return failure("At least one admin account must remain active.");
  }

  const target = await prisma.admin.findUnique({ where: { id: parsedId.data } });
  if (!target) {
    return failure("That admin account no longer exists.");
  }

  try {
    await prisma.admin.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("deleteAdminAccount", error);
    return failure("We couldn't remove that admin account right now. Please try again later.");
  }

  revalidateAdminPaths(["/admin/overview", "/admin/admins"]);

  return success({ message: "Admin account removed." });
}

export async function removeUserAccount(userId: number | string): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await getAdminSession();
  if (!sessionInfo) {
    return failure("Only admins can remove user accounts.");
  }

  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    return failure(parsedId.error.issues[0]?.message ?? "Invalid user reference.");
  }

  const user = await prisma.user.findUnique({ where: { id: parsedId.data } });
  if (!user) {
    return failure("That user account was already removed.");
  }

  try {
    await prisma.user.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("removeUserAccount", error);
    return failure("We couldn’t remove that user. Please try again later.");
  }

  revalidateAdminPaths(["/admin/overview", "/admin/users"]);

  return success({ message: "User account removed." });
}

export async function resolveReport(reportId: number | string): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await getAdminSession();
  if (!sessionInfo) {
    return failure("Only admins can resolve reports.");
  }

  const parsedId = idSchema.safeParse(reportId);
  if (!parsedId.success) {
    return failure(parsedId.error.issues[0]?.message ?? "Invalid report reference.");
  }

  const report = await prisma.report.findUnique({ where: { id: parsedId.data } });
  if (!report) {
    return failure("That report was already cleared.");
  }

  try {
    await prisma.report.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("resolveReport", error);
    return failure("We couldn't resolve that report right now. Please try again.");
  }

  revalidateAdminPaths(["/admin/overview", "/admin/reports"]);

  return success({ message: "Report resolved." });
}

export async function removeReportedRequest(reportId: number | string): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await getAdminSession();
  if (!sessionInfo) {
    return failure("Only admins can remove reported requests.");
  }

  const parsedId = idSchema.safeParse(reportId);
  if (!parsedId.success) {
    return failure(parsedId.error.issues[0]?.message ?? "Invalid report reference.");
  }

  const report = await prisma.report.findUnique({
    where: { id: parsedId.data },
    select: { id: true, requestId: true },
  });

  if (!report) {
    return failure("That report was already handled.");
  }

  if (!report.requestId) {
    await prisma.report.delete({ where: { id: report.id } });
    revalidateAdminPaths(["/admin/overview", "/admin/reports"]);
    return success({ message: "Report removed." });
  }

  try {
    await prisma.$transaction([
      prisma.bloodRequest.delete({ where: { id: report.requestId } }),
      prisma.report.deleteMany({ where: { requestId: report.requestId } }),
    ]);
  } catch (error) {
    console.error("removeReportedRequest", error);
    return failure("We couldn't remove that request right now. Please try again later.");
  }

  revalidateAdminPaths(["/admin/overview", "/admin/reports"]);
  revalidatePath("/requests");
  revalidatePath("/feed");

  return success({ message: "Reported request removed." });
}
