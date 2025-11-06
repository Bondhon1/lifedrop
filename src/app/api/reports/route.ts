import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  requestId: z.number(),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
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
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requestId, reason } = parsed.data;

    // Check if the blood request exists
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
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
        { status: 404 }
      );
    }

    // Create report in database
    const report = await prisma.report.create({
      data: {
        reason,
        requestId,
        reportedBy: userId,
      },
    });

    // Get all admins to notify
    const admins = await prisma.admin.findMany({
      select: { id: true },
    });

    // Create notifications for all admins
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        adminRecipientId: admin.id,
        message: `New report for blood request by ${bloodRequest.user.name || "User"} (Patient: ${bloodRequest.patientName}): ${reason.substring(0, 100)}${reason.length > 100 ? "..." : ""}`,
        link: `/admin/reports/${report.id}`,
        senderId: userId,
      }));

      await prisma.notification.createMany({
        data: notifications,
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
