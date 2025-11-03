"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageFile, deleteStoredFile } from "@/lib/storage";
import { failure, success, type ActionState } from "./types";
import { issueEmailVerification } from "@/server/services/email-verification";

async function requireSessionUser(): Promise<{ userId: number; user: SessionUser } | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id);

  if (!sessionUser || !Number.isInteger(userId)) {
    return null;
  }

  return { userId, user: sessionUser };
}

const profileSchema = z.object({
  name: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  bloodGroup: z.string().trim().max(5).optional().nullable(),
  medicalHistory: z.string().trim().max(2000).optional().nullable(),
  divisionId: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : null;
    }),
  districtId: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : null;
    }),
  upazilaId: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : null;
    }),
});

export async function updateProfile(formData: FormData): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await requireSessionUser();
  if (!sessionInfo) {
    return failure("You need to be signed in to update your profile.");
  }

  const rawValues = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    bloodGroup: formData.get("bloodGroup"),
    medicalHistory: formData.get("medicalHistory"),
    divisionId: formData.get("divisionId"),
    districtId: formData.get("districtId"),
    upazilaId: formData.get("upazilaId"),
  };

  const parsed = profileSchema.safeParse(rawValues);
  if (!parsed.success) {
    return failure("Please review the fields and try again.", parsed.error.issues.map((issue) => issue.message));
  }

  const values = parsed.data;

  const normalizeOptional = (input: string | null | undefined) => {
    if (typeof input !== "string") {
      return null;
    }
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  try {
    await prisma.user.update({
      where: { id: sessionInfo.userId },
      data: {
        name: normalizeOptional(values.name),
        phone: normalizeOptional(values.phone),
        address: normalizeOptional(values.address),
        bloodGroup: normalizeOptional(values.bloodGroup),
        medicalHistory: normalizeOptional(values.medicalHistory),
        divisionId: values.divisionId,
        districtId: values.districtId,
        upazilaId: values.upazilaId,
      },
    });

  ["/profile", "/requests", "/feed"].forEach((path) => revalidatePath(path));

    return success({ message: "Profile updated" });
  } catch (error) {
    console.error("updateProfile:error", error);
    return failure("We couldn’t save your profile right now. Please try again in a moment.");
  }
}

const imageFields = ["profilePicture", "coverPhoto"] as const;

type ImageField = (typeof imageFields)[number];

const imageFolders: Record<ImageField, string> = {
  profilePicture: "profiles",
  coverPhoto: "covers",
};

export async function updateProfileImages(formData: FormData): Promise<ActionState<{ profilePicture?: string; coverPhoto?: string }>> {
  const sessionInfo = await requireSessionUser();
  if (!sessionInfo) {
    return failure("You need to be signed in to update your profile images.");
  }

  const uploads: Partial<Record<ImageField, string>> = {};

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionInfo.userId },
      select: {
        profilePicture: true,
        coverPhoto: true,
      },
    });

    if (!currentUser) {
      return failure("We couldn’t find your account.");
    }

    for (const field of imageFields) {
      const file = formData.get(field);
      if (file instanceof File && file.size > 0) {
        try {
          const stored = await saveImageFile(file, imageFolders[field]);
          uploads[field] = stored;
        } catch (uploadError) {
          console.error(`updateProfileImages:${field}`, uploadError);
          return failure("One of the images could not be uploaded. Please use a JPG, PNG, or WEBP under 5MB.");
        }
      }
    }

    if (Object.keys(uploads).length === 0) {
      return failure("Select an image to upload before saving.");
    }

    await prisma.user.update({
      where: { id: sessionInfo.userId },
      data: {
        ...(uploads.profilePicture ? { profilePicture: uploads.profilePicture } : {}),
        ...(uploads.coverPhoto ? { coverPhoto: uploads.coverPhoto } : {}),
      },
    });

    if (uploads.profilePicture && currentUser.profilePicture && currentUser.profilePicture !== uploads.profilePicture) {
      await deleteStoredFile(currentUser.profilePicture);
    }

    if (uploads.coverPhoto && currentUser.coverPhoto && currentUser.coverPhoto !== uploads.coverPhoto) {
      await deleteStoredFile(currentUser.coverPhoto);
    }

  ["/profile", "/chat"].forEach((path) => revalidatePath(path));

    return success(uploads);
  } catch (error) {
    console.error("updateProfileImages:error", error);
    return failure("We couldn’t update your images right now. Please try again soon.");
  }
}

export async function requestEmailVerification(): Promise<ActionState<{ url: string }>> {
  const sessionInfo = await requireSessionUser();
  if (!sessionInfo) {
    return failure("You need to be signed in to verify your email.");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: sessionInfo.userId } });
  if (!dbUser) {
    return failure("We couldn’t find your account.");
  }

  if (!dbUser.email) {
    return failure("Add an email address to your profile before requesting verification.");
  }

  if (dbUser.emailVerified) {
    return failure("Your email is already verified.");
  }

  try {
    const { verifyUrl } = await issueEmailVerification({
      email: dbUser.email,
      name: dbUser.name,
      username: dbUser.username,
    });

    return success({ url: verifyUrl });
  } catch (error) {
    console.error("requestEmailVerification:error", error);
    return failure("We couldn’t send the verification email. Please try again later.");
  }
}

export async function verifyEmailToken(token: string): Promise<ActionState<{ email: string }>> {
  if (!token || token.length < 10) {
    return failure("Invalid verification token.");
  }

  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record) {
    return failure("This verification link is no longer valid.");
  }

  if (record.expires && record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    });
    return failure("This verification link has expired. Please request a new one.");
  }

  const user = await prisma.user.findFirst({ where: { email: record.identifier } });
  if (!user) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    });
    return failure("We couldn’t find an account for this verification link.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ]);

  ["/profile"].forEach((path) => revalidatePath(path));

  return success({ email: record.identifier });
}
