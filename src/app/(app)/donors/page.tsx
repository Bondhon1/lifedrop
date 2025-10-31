import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, type SessionUser } from "@/lib/auth";
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

const buildImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

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

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="border border-rose-500/25 bg-rose-950/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">{card.title}</CardTitle>
                <p className="text-sm text-rose-100/70">{card.description}</p>
              </div>
              <card.icon className="h-8 w-8 text-rose-300" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-rose-500/25 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-white">Become a verified donor</CardTitle>
            <p className="text-sm text-rose-100/80">
              Submit your documents once and get fast-tracked for urgent matches. You can update your availability at any time.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {viewerApplication ? <DonorProfileManager application={viewerApplication} /> : <DonorApplicationForm />}
          </CardContent>
        </Card>

        <Card className="border border-rose-500/25 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">How matching works</CardTitle>
            <p className="text-sm text-rose-100/80">Stay prepared so coordinators can reach you first during critical requests.</p>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm text-rose-100/80">
              <li className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                <strong className="text-white">Keep your blood group and location up to date.</strong>
                <p className="text-rose-100/70">We match donors based on proximity and compatibility.</p>
              </li>
              <li className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                <strong className="text-white">Maintain a 90 day gap between donations.</strong>
                <p className="text-rose-100/70">Set a reminder after you donate so medical teams know when you&apos;re ready again.</p>
              </li>
              <li className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3">
                <strong className="text-white">Share medical notes for faster approval.</strong>
                <p className="text-rose-100/70">Upload recent test results or doctor recommendations to streamline verification.</p>
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

      <section className="grid gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Featured donors</h2>
            <p className="text-sm text-rose-100/80">
              Connect with verified donors who recently pledged to help. Send a friend request to coordinate faster.
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/requests">Find a matching request</Link>
          </Button>
        </header>

        {donorApplications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rose-500/30 bg-rose-500/10 p-10 text-center text-sm text-rose-100/80">
            No approved donors yet. Submit your application and invite friends to grow the network.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {donorApplications.map((application) => {
              const displayName = application.user.name?.trim() ? application.user.name : application.user.username;
              const profileImage = buildImageUrl(application.user.profilePicture);
              const location = [application.user.upazila?.name, application.user.district?.name, application.user.division?.name]
                .filter(Boolean)
                .join(", ");
              const lastDonation = formatDate(application.lastDonationDate);
              const joined = formatDate(application.updatedAt ?? application.createdAt);

              return (
                <article
                  key={application.id}
                  className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/70 p-5 shadow-lg shadow-rose-900/30"
                >
                  <div className="flex items-start gap-4">
                    <Avatar src={profileImage} alt={`${displayName} avatar`} className="ring-2 ring-rose-500/40" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">{displayName}</p>
                        {application.user.bloodGroup ? <Badge className="bg-rose-500/30 text-rose-50">{application.user.bloodGroup}</Badge> : null}
                      </div>
                      <p className="text-xs uppercase tracking-wide text-rose-200/70">@{application.user.username}</p>
                      {location ? <p className="text-sm text-rose-100/70">{location}</p> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-rose-100/80">
                    <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2">
                      <span>Last donation</span>
                      <span className="text-white">{lastDonation ?? "Not shared"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2">
                      <span>Joined network</span>
                      <span className="text-white">{joined ?? "Recently"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2">
                      <span>Eligible status</span>
                      <span className="text-white">{application.hasDonatedBefore ? "Experienced donor" : "Ready for first donation"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" asChild size="sm">
                      <Link href={`/members/${application.user.username}`}>View profile</Link>
                    </Button>
                    <Button variant="ghost" asChild size="sm">
                      <Link href={`/chat?with=${application.user.id}`}>Start conversation</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
