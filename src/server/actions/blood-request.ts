'use server';

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { differenceInCalendarDays, addDays } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bloodRequestFormSchema } from "@/lib/validators/blood-request";
import { createNotification } from "@/server/services/notification";
import { saveImageFile } from "@/lib/storage";
import { failure, success, type ActionState } from "./types";
import type { SessionUser } from "@/lib/auth";

const REVALIDATE_PATHS = ["/feed", "/requests", "/dashboard", "/notifications"];

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

export async function createBloodRequest(formData: FormData): Promise<ActionState<{ id: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to create a blood request.");
  }

  const profile = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
      emailVerified: true,
      name: true,
      phone: true,
      bloodGroup: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
    },
  });

  if (!profile) {
    return failure("We couldn’t find your account.");
  }

  if (!profile.emailVerified) {
    return failure("Verify your email before posting a blood request.");
  }

  const missingFields: string[] = [];

  if (!profile.name) {
    missingFields.push("display name");
  }

  if (!profile.phone) {
    missingFields.push("phone number");
  }

  if (!profile.bloodGroup) {
    missingFields.push("blood group");
  }

  if (!profile.divisionId || !profile.districtId || !profile.upazilaId) {
    missingFields.push("address details");
  }

  if (missingFields.length > 0) {
    return failure(
      `Please complete your profile (${missingFields.join(", ")}) before posting a blood request.`,
    );
  }

  const rawInput = {
    patientName: formData.get("patientName"),
    gender: formData.get("gender"),
    requiredDate: formData.get("requiredDate"),
    bloodGroup: formData.get("bloodGroup"),
    amountNeeded: formData.get("amountNeeded"),
    hospitalName: formData.get("hospitalName"),
    urgencyStatus: formData.get("urgencyStatus"),
    smokerPreference: formData.get("smokerPreference"),
    reason: formData.get("reason"),
    location: formData.get("location"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    divisionId: formData.get("divisionId"),
    districtId: formData.get("districtId"),
    upazilaId: formData.get("upazilaId"),
    addressLabel: formData.get("addressLabel"),
  };

  const parsed = bloodRequestFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    return failure("Please review the highlighted fields.", parsed.error.issues.map((issue) => issue.message));
  }

  const values = parsed.data;

  const imageEntries = formData.getAll("images");
  const imageFiles: File[] = imageEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (imageFiles.length > 6) {
    return failure("You can upload up to 6 images per request.");
  }

  const storedImages: string[] = [];

  for (const file of imageFiles) {
    try {
      const stored = await saveImageFile(file, "requests");
      storedImages.push(stored);
    } catch (error) {
      console.error("createBloodRequest:image", error);
      return failure("One of the images could not be uploaded. Use JPG/PNG/WebP under 5MB.");
    }
  }

  try {
    const request = await prisma.bloodRequest.create({
      data: {
        patientName: values.patientName,
        gender: values.gender,
        requiredDate: values.requiredDate,
        bloodGroup: values.bloodGroup,
        amountNeeded: values.amountNeeded,
        hospitalName: values.hospitalName,
        urgencyStatus: values.urgencyStatus,
        smokerPreference: values.smokerPreference,
        reason: values.reason,
        location: values.location || values.addressLabel || "",
        images: storedImages,
        latitude: values.latitude,
        longitude: values.longitude,
        user: {
          connect: {
            id: authResult.userId,
          },
        },
        ...(values.divisionId
          ? {
              division: {
                connect: { id: values.divisionId },
              },
            }
          : {}),
        ...(values.districtId
          ? {
              district: {
                connect: { id: values.districtId },
              },
            }
          : {}),
        ...(values.upazilaId
          ? {
              upazila: {
                connect: { id: values.upazilaId },
              },
            }
          : {}),
      } as Prisma.BloodRequestCreateInput,
      select: {
        id: true,
      },
    });

    REVALIDATE_PATHS.forEach((path) => revalidatePath(path));

    return success({ id: request.id });
  } catch (error) {
    console.error("createBloodRequest:error", error);
    return failure("We couldn’t publish this request. Please try again in a moment.");
  }
}

export async function toggleBloodRequestUpvote(requestId: number): Promise<ActionState<{ upvotes: number; upvoted: boolean }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to support a request.");
  }

  if (!Number.isInteger(requestId)) {
    return failure("Invalid request identifier.");
  }

  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      patientName: true,
    },
  });

  if (!request) {
    return failure("That request no longer exists.");
  }

  const actor = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true },
  });

  if (!actor) {
    return failure("Please register for donor first.");
  }

  try {
    const existingUpvote = await prisma.bloodRequestUpvote.findUnique({
      where: {
        userId_bloodRequestId: {
          userId: authResult.userId,
          bloodRequestId: requestId,
        },
      },
    });

    if (existingUpvote) {
      await prisma.$transaction([
        prisma.bloodRequestUpvote.delete({
          where: { id: existingUpvote.id },
        }),
        prisma.bloodRequest.update({
          where: { id: requestId },
          data: {
            upvoteCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      const upvotes = await prisma.bloodRequestUpvote.count({ where: { bloodRequestId: requestId } });
      REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
      return success({ upvotes, upvoted: false });
    }

    await prisma.$transaction([
      prisma.bloodRequestUpvote.create({
        data: {
          userId: authResult.userId,
          bloodRequestId: requestId,
        },
      }),
      prisma.bloodRequest.update({
        where: { id: requestId },
        data: {
          upvoteCount: {
            increment: 1,
          },
        },
      }),
    ]);

    if (request.userId !== authResult.userId) {
      const actorName = authResult.sessionUser?.name ?? authResult.sessionUser?.email ?? "A community member";
      await createNotification({
        recipientId: request.userId,
        senderId: authResult.userId,
        message: `${actorName} supported your request for ${request.patientName}.`,
        link: `/requests/${request.id}`,
      });
    }

    const upvotes = await prisma.bloodRequestUpvote.count({ where: { bloodRequestId: requestId } });
    REVALIDATE_PATHS.forEach((path) => revalidatePath(path));

    return success({ upvotes, upvoted: true });
  } catch (error) {
    console.error("toggleBloodRequestUpvote:error", error);
    return failure("We couldn’t update your support right now. Please try again.");
  }
}

export async function respondToBloodRequest(requestId: number): Promise<ActionState<{ donorsAssigned: number; amountNeeded: number }>> {
  const authResult = await ensureAuthenticatedUser();
  if (!authResult.userId) {
    return failure("You need to be signed in to respond to a request.");
  }

  if (!Number.isInteger(requestId)) {
    return failure("Invalid request identifier.");
  }

  const donorProfile = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
      emailVerified: true,
      bloodGroup: true,
      name: true,
      donorApplication: {
        select: {
          status: true,
          lastDonationDate: true,
        },
      },
    },
  });

  if (!donorProfile) {
    return failure("Please register for donor first.");
  }

  if (!donorProfile.emailVerified) {
    return failure("Verify your email before volunteering to donate.");
  }

  const donorApplication = donorProfile.donorApplication;
  if (!donorApplication || donorApplication.status !== "Approved") {
    return failure("Only approved donors can respond to requests.");
  }

  if (donorApplication.lastDonationDate) {
    const daysSinceDonation = differenceInCalendarDays(new Date(), donorApplication.lastDonationDate);
    if (daysSinceDonation < 90) {
      const nextEligible = addDays(donorApplication.lastDonationDate, 90);
      const formatted = nextEligible.toISOString().split("T")[0];
      return failure(`You can donate again after ${formatted}.`);
    }
  }

  if (!donorProfile.bloodGroup) {
    return failure("Add your blood group to your profile before responding.");
  }

  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      amountNeeded: true,
      donorsAssigned: true,
      status: true,
      patientName: true,
      bloodGroup: true,
      requiredDate: true,
    },
  });

  if (!request) {
    return failure("We couldn’t find that request.");
  }

  if (request.userId === authResult.userId) {
    return failure("You can’t respond to your own request.");
  }

  const totalNeeded = Number(request.amountNeeded);
  if (request.donorsAssigned >= totalNeeded) {
    return failure("This request has already reached the required donors.");
  }

  const existingResponse = await prisma.donorResponse.findUnique({
    where: {
      donorId_requestId: {
        donorId: authResult.userId,
        requestId,
      },
    },
  });

  if (existingResponse) {
    return failure("You’ve already pledged to help with this request.");
  }

  if (donorProfile.bloodGroup !== request.bloodGroup) {
    return failure("Your blood group does not match the requirement for this request.");
  }

  try {
    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.donorResponse.create({
        data: {
          donorId: authResult.userId,
          requestId,
        },
      });

      const result = await tx.bloodRequest.update({
        where: { id: requestId },
        data: {
          donorsAssigned: {
            increment: 1,
          },
          ...(request.donorsAssigned + 1 >= totalNeeded
            ? { status: "Fulfilled" }
            : {}),
        },
        select: {
          donorsAssigned: true,
          amountNeeded: true,
        },
      });

      await tx.donorApplication.update({
        where: { userId: authResult.userId },
        data: {
          lastDonationDate: request.requiredDate ?? new Date(),
        },
      });

      return result;
    });

    if (request.userId !== authResult.userId) {
      const actorName = donorProfile.name ?? authResult.sessionUser?.name ?? "A community member";
      await createNotification({
        recipientId: request.userId,
        senderId: authResult.userId,
        message: `${actorName} volunteered to donate for ${request.patientName}.`,
        link: `/requests/${request.id}`,
      });
    }

    REVALIDATE_PATHS.forEach((path) => revalidatePath(path));

    return success({
      donorsAssigned: updated.donorsAssigned,
      amountNeeded: Number(updated.amountNeeded),
    });
  } catch (error) {
    console.error("respondToBloodRequest:error", error);
    return failure("Something went wrong while recording your response. Please try again.");
  }
}
