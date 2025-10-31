"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageFile } from "@/lib/storage";
import { createNotification } from "@/server/services/notification";
import { failure, success, type ActionState } from "./types";

async function requireSessionUser(): Promise<{ userId: number; user: SessionUser } | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id);

  if (!sessionUser || !Number.isInteger(userId)) {
    return null;
  }

  return { userId, user: sessionUser };
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  return Boolean(sessionUser?.isAdmin);
}

const ADMIN_REVALIDATE_PATHS = ["/donors", "/dashboard", "/admin/overview", "/admin/donors"] as const;

function revalidateAdminDonorViews() {
  ADMIN_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

const dateFromInput = z
  .string()
  .trim()
  .min(1, "Select a date")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Provide a valid date")
  .transform((value) => {
    const parsed = new Date(value);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  });

const optionalDateFromInput = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value !== "string" || value.trim().length === 0) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  });

const donorApplicationSchema = z
  .object({
    dateOfBirth: dateFromInput,
    hasDonatedBefore: z.boolean(),
    lastDonationDate: optionalDateFromInput,
    medicalConditions: z
      .union([z.string(), z.undefined(), z.null()])
      .transform((value) => {
        if (typeof value !== "string") {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      })
      .refine((value) => !value || value.length <= 2000, "Medical conditions note is too long"),
  })
  .refine(
    (data) => {
      if (data.hasDonatedBefore) {
        return data.lastDonationDate !== null;
      }
      return true;
    },
    {
      message: "Share your last donation date so coordinators can plan follow-ups.",
      path: ["lastDonationDate"],
    },
  );

export async function submitDonorApplication(formData: FormData): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await requireSessionUser();
  if (!sessionInfo) {
    return failure("Sign in to submit a donor application.");
  }

  const rawValues = {
    dateOfBirth: formData.get("dateOfBirth"),
    hasDonatedBefore: formData.get("hasDonatedBefore"),
    lastDonationDate: formData.get("lastDonationDate"),
    medicalConditions: formData.get("medicalConditions"),
  } satisfies Record<string, FormDataEntryValue | null>;

  const parsed = donorApplicationSchema.safeParse({
    dateOfBirth: typeof rawValues.dateOfBirth === "string" ? rawValues.dateOfBirth : "",
    hasDonatedBefore:
      rawValues.hasDonatedBefore === "true"
      || rawValues.hasDonatedBefore === "on"
      || rawValues.hasDonatedBefore === "1",
    lastDonationDate: rawValues.lastDonationDate,
    medicalConditions: rawValues.medicalConditions,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Review the fields and try again.";
    return failure(message);
  }

  const existingApplication = await prisma.donorApplication.findUnique({ where: { userId: sessionInfo.userId } });
  if (existingApplication) {
    if (existingApplication.status === "Pending") {
      return failure("Your donor application is already under review.");
    }

    if (existingApplication.status === "Approved") {
      return failure("You are already an approved donor.");
    }
  }

  const nidDocument = formData.get("nidDocument");
  if (!(nidDocument instanceof File) || nidDocument.size === 0) {
    return failure("Upload your NID or birth certificate copy.");
  }

  let nidPath: string;
  try {
    nidPath = await saveImageFile(nidDocument, "nid");
  } catch (error) {
    console.error("submitDonorApplication:nid", error);
    return failure("The ID document could not be uploaded. Use a JPG/PNG/WebP under 5MB.");
  }

  const medicalHistoryUploads = formData.getAll("medicalHistoryImages");
  const medicalHistoryFiles: File[] = medicalHistoryUploads.filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const medicalImagePaths: string[] = [];

  for (const file of medicalHistoryFiles) {
    try {
      const stored = await saveImageFile(file, "medical");
      medicalImagePaths.push(stored);
    } catch (error) {
      console.error("submitDonorApplication:medical", error);
      return failure("One of the medical documents could not be uploaded. Use JPG/PNG/WebP under 5MB.");
    }
  }

  try {
    await prisma.donorApplication.create({
      data: {
        userId: sessionInfo.userId,
        dateOfBirth: parsed.data.dateOfBirth,
        hasDonatedBefore: parsed.data.hasDonatedBefore,
        lastDonationDate: parsed.data.lastDonationDate,
        medicalConditions: parsed.data.medicalConditions,
        nidOrBirthCertificate: nidPath,
        medicalHistoryImages: medicalImagePaths,
      },
    });
  } catch (error) {
    console.error("submitDonorApplication:create", error);
    return failure("We couldn’t save your application right now. Please try again later.");
  }

  ["/donors", "/profile", "/dashboard"].forEach((path) => revalidatePath(path));

  return success({ message: "Your application was submitted. Our team will review it shortly." });
}

const donorUpdateSchema = z.object({
  applicationId: z
    .union([z.string(), z.number()])
    .transform((value) => {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isInteger(parsed) ? parsed : NaN;
    })
    .refine((value) => Number.isInteger(value) && value > 0, "Invalid application reference."),
  lastDonationDate: optionalDateFromInput,
  medicalConditions: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((value) => {
      if (typeof value !== "string") {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => !value || value.length <= 2000, "Medical conditions note is too long"),
});

export async function updateDonorApplication(formData: FormData): Promise<ActionState<{ message: string }>> {
  const sessionInfo = await requireSessionUser();
  if (!sessionInfo) {
    return failure("Sign in to update your donor profile.");
  }

  const parsed = donorUpdateSchema.safeParse({
    applicationId: formData.get("applicationId"),
    lastDonationDate: formData.get("lastDonationDate"),
    medicalConditions: formData.get("medicalConditions"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Review the fields and try again.";
    return failure(message);
  }

  const application = await prisma.donorApplication.findUnique({
    where: { id: parsed.data.applicationId },
  });

  if (!application || application.userId !== sessionInfo.userId) {
    return failure("We couldn’t find your donor profile.");
  }

  const medicalHistoryUploads = formData.getAll("medicalHistoryImages");
  const medicalHistoryFiles: File[] = medicalHistoryUploads.filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const newMedicalImages: string[] = [];

  for (const file of medicalHistoryFiles) {
    try {
      const stored = await saveImageFile(file, "medical");
      newMedicalImages.push(stored);
    } catch (error) {
      console.error("updateDonorApplication:medical", error);
      return failure("One of the uploaded files could not be processed. Use JPG/PNG/WebP under 5MB.");
    }
  }

  try {
    await prisma.donorApplication.update({
      where: { id: application.id },
      data: {
        lastDonationDate: parsed.data.lastDonationDate,
        medicalConditions: parsed.data.medicalConditions,
        ...(newMedicalImages.length > 0
          ? { medicalHistoryImages: [...application.medicalHistoryImages, ...newMedicalImages] }
          : {}),
      },
    });
  } catch (error) {
    console.error("updateDonorApplication:update", error);
    return failure("We couldn’t update your donor profile right now. Please try again later.");
  }

  ["/donors", "/profile"].forEach((path) => revalidatePath(path));

  return success({ message: "Donor profile updated." });
}

const parseApplicationId = (value: number | string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
};

export async function approveDonorApplication(applicationId: number | string): Promise<ActionState<{ message: string }>> {
  if (!(await requireAdmin())) {
    return failure("Only admins can approve donor applications.");
  }

  const parsedId = parseApplicationId(applicationId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return failure("Invalid application reference.");
  }

  const application = await prisma.donorApplication.findUnique({
    where: { id: parsedId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    return failure("We couldn't find that donor application.");
  }

  if (application.status !== "Pending") {
    return failure("Only pending applications can be approved.");
  }

  try {
    await prisma.donorApplication.update({
      where: { id: parsedId },
      data: { status: "Approved" },
    });
  } catch (error) {
    console.error("approveDonorApplication:update", error);
    return failure("We couldn't approve this application right now. Try again shortly.");
  }

  try {
    await createNotification({
      recipientId: application.userId,
      message: "Your donor application has been approved. You're now listed in the donor network.",
      link: "/donors",
    });
  } catch (error) {
    console.error("approveDonorApplication:notify", error);
  }

  revalidateAdminDonorViews();

  return success({ message: "Application approved successfully." });
}

export async function rejectDonorApplication(applicationId: number | string): Promise<ActionState<{ message: string }>> {
  if (!(await requireAdmin())) {
    return failure("Only admins can reject donor applications.");
  }

  const parsedId = parseApplicationId(applicationId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return failure("Invalid application reference.");
  }

  const application = await prisma.donorApplication.findUnique({
    where: { id: parsedId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!application) {
    return failure("We couldn't find that donor application.");
  }

  if (application.status !== "Pending") {
    return failure("Only pending applications can be rejected.");
  }

  try {
    await prisma.donorApplication.update({
      where: { id: parsedId },
      data: { status: "Rejected" },
    });
  } catch (error) {
    console.error("rejectDonorApplication:update", error);
    return failure("We couldn't reject this application right now. Try again shortly.");
  }

  try {
    await createNotification({
      recipientId: application.userId,
      message: "We couldn't approve your donor application. Update your details and resubmit when ready.",
      link: "/donors",
    });
  } catch (error) {
    console.error("rejectDonorApplication:notify", error);
  }

  revalidateAdminDonorViews();

  return success({ message: "Application rejected." });
}
