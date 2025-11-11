import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z
  .object({
    requestId: z.number().int().positive().optional(),
    reportedUserId: z.number().int().positive().optional(),
    reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
  })
  .superRefine((data, ctx) => {
    const hasRequest = typeof data.requestId === "number";
    const hasUser = typeof data.reportedUserId === "number";

    if (hasRequest === hasUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either a requestId or reportedUserId.",
        path: ["requestId"],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser | undefined;

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(sessionUser.id);
    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        { error: "Unable to resolve your account identifier." },
        { status: 400 },
      );
    }
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requestId, reportedUserId, reason } = parsed.data;

    let notificationMessage = "";
    let reportLink = "";

    if (typeof reportedUserId === "number") {
      if (reportedUserId === userId) {
        return NextResponse.json(
          { error: "You cannot report your own profile." },
          { status: 400 },
        );
      }

      const reportedUser = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: {
          id: true,
          username: true,
          name: true,
        },
      });

      if (!reportedUser) {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 },
        );
      }

      const report = await prisma.report.create({
        data: {
          reason,
          postId: reportedUserId,
          reportedBy: userId,
        },
      });

      const admins = await prisma.admin.findMany({
        select: { id: true },
      });

      if (admins.length > 0) {
        notificationMessage = `Profile report for ${reportedUser.name || reportedUser.username}: ${reason.substring(0, 100)}${reason.length > 100 ? "..." : ""}`;
        reportLink = `/admin/reports/${report.id}`;

        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            adminRecipientId: admin.id,
            message: notificationMessage,
            link: reportLink,
            senderId: userId,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        message: "Report submitted successfully",
        reportId: report.id,
      });
    }

    // requestId must be defined at this point
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: requestId! },
      select: {
        id: true,
        patientName: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!bloodRequest) {
      return NextResponse.json(
        { error: "Blood request not found" },
        { status: 404 },
      );
    }

    const report = await prisma.report.create({
      data: {
        reason,
        requestId: bloodRequest.id,
        reportedBy: userId,
      },
    });

    const admins = await prisma.admin.findMany({
      select: { id: true },
    });

    if (admins.length > 0) {
      notificationMessage = `New report for blood request by ${bloodRequest.user.name || "User"} (Patient: ${bloodRequest.patientName}): ${reason.substring(0, 100)}${reason.length > 100 ? "..." : ""}`;
      reportLink = `/admin/reports/${report.id}`;

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          adminRecipientId: admin.id,
          message: notificationMessage,
          link: reportLink,
          senderId: userId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
      reportId: report.id,
    });
  } catch (error) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
