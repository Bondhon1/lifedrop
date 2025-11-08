import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, type SessionUser } from "@/lib/auth";
import { resolveImageUrl as buildImageUrl } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DonorApplicationForm } from "@/components/donors/donor-application-form";
import { DonorProfileManager } from "@/components/donors/donor-profile-manager";
import type { DonorProfileManagerProps } from "@/components/donors/donor-profile-manager";
import { Droplet, Handshake, ShieldCheck, Users2 } from "lucide-react";

function isDatabaseUnavailableError(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P1001";
}

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const parsed = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(parsed);
};

type DonorWithUser = Prisma.DonorApplicationGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        name: true;
        bloodGroup: true;
        profilePicture: true;
        division: { select: { name: true } };
        district: { select: { name: true } };
        upazila: { select: { name: true } };
      };
    };
  };
}>;

export default async function DonorsPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const viewerId = Number(sessionUser?.id);
  const viewerIsAuthenticated = Number.isInteger(viewerId);

  let approvedDonorCount = 0;
  let pendingApplicationCount = 0;
  let totalPledges = 0;
  let donorApplications: DonorWithUser[] = [];
  let viewerApplication: DonorProfileManagerProps["application"] | null = null;

  if (viewerIsAuthenticated) {
    try {
      const record = await prisma.donorApplication.findUnique({
        where: { userId: viewerId },
      });

      if (record) {
        viewerApplication = {
          id: record.id,
          status: record.status,
          dateOfBirth: record.dateOfBirth.toISOString(),
          hasDonatedBefore: record.hasDonatedBefore,
          lastDonationDate: record.lastDonationDate ? record.lastDonationDate.toISOString() : null,
          medicalConditions: record.medicalConditions ?? null,
          medicalHistoryImages: record.medicalHistoryImages,
          nidOrBirthCertificate: record.nidOrBirthCertificate,
          updatedAt: record.updatedAt.toISOString(),
        };
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        console.error("Database unavailable while loading viewer donor application", error);
      } else {
        throw error;
      }
    }
  }

  try {
    const [approved, pending, pledges, donors] = await Promise.all([
      prisma.donorApplication.count({ where: { status: "Approved" } }),
      prisma.donorApplication.count({ where: { status: "Pending" } }),
      prisma.donorResponse.count(),
      prisma.donorApplication.findMany({
        where: { status: "Approved" },
        orderBy: { updatedAt: "desc" },
        take: 18,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              bloodGroup: true,
              profilePicture: true,
              division: { select: { name: true } },
              district: { select: { name: true } },
              upazila: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    approvedDonorCount = approved;
    pendingApplicationCount = pending;
    totalPledges = pledges;
    donorApplications = donors;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      console.error("Database unavailable while loading donor stats", error);
      approvedDonorCount = 0;
      pendingApplicationCount = 0;
      totalPledges = 0;
      donorApplications = [];
    } else {
      throw error;
    }
  }

  const statCards = [
    {
      title: "Approved donors",
      value: approvedDonorCount,
      description: "Verified and ready to respond",
      icon: Users2,
    },
    {
      title: "Pending reviews",
      value: pendingApplicationCount,
      description: "Applications in moderation queue",
      icon: ShieldCheck,
    },
    {
      title: "Total pledges",
      value: totalPledges,
      description: "Donations offered on requests",
      icon: Handshake,
    },
  ];

  const isApprovedDonor = viewerApplication?.status === "Approved";

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              {isApprovedDonor ? "Your donor profile" : "Become a verified donor"}
            </CardTitle>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isApprovedDonor 
                ? "You're verified and ready to respond to urgent requests. Keep your availability updated so coordinators can reach you." 
                : "Submit your documents once and get fast-tracked for urgent matches. You can update your availability at any time."}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {viewerApplication ? <DonorProfileManager application={viewerApplication} /> : <DonorApplicationForm />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">How matching works</CardTitle>
            <p className="text-sm text-[var(--color-text-secondary)]">Stay prepared so coordinators can reach you first during critical requests.</p>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm text-[var(--color-text-secondary)]">
              <li className="rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-3">
                <strong className="text-primary">Keep your blood group and location up to date.</strong>
                <p className="text-[var(--color-text-secondary)]">We match donors based on proximity and compatibility.</p>
              </li>
              <li className="rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-3">
                <strong className="text-primary">Maintain a 90 day gap between donations.</strong>
                <p className="text-[var(--color-text-secondary)]">Set a reminder after you donate so medical teams know when you&apos;re ready again.</p>
              </li>
              <li className="rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-3">
                <strong className="text-primary">Share medical notes for faster approval.</strong>
                <p className="text-[var(--color-text-secondary)]">Upload recent test results or doctor recommendations to streamline verification.</p>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/requests">
                  <Droplet className="h-4 w-4" /> View urgent requests
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/friends">Grow your donor network</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex justify-center">
        <Button variant="secondary" asChild>
          <Link href="/requests">Find a matching request</Link>
        </Button>
      </section>
    </div>
  );
}
