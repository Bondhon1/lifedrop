import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Droplet, HeartPulse, MessageCircle } from "lucide-react";

function isDatabaseUnavailableError(error: unknown): error is { code?: string } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P1001";
}

export default async function DashboardPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const parsedUserId = sessionUser ? Number(sessionUser.id) : undefined;
  const hasUserId = typeof parsedUserId === "number" && Number.isInteger(parsedUserId);
  const userId = hasUserId ? parsedUserId : undefined;

  let activeRequests = 0;
  let donorResponses = 0;
  let unreadMessages = 0;

  if (hasUserId && userId !== undefined) {
    try {
      [activeRequests, donorResponses, unreadMessages] = await Promise.all([
        prisma.bloodRequest.count({ where: { userId, status: { in: ["Open", "Pending"] } } }),
        prisma.donorResponse.count({ where: { donorId: userId } }),
        prisma.chatMessage.count({ where: { receiverId: userId, isRead: false } }),
      ]);
    } catch (error: unknown) {
      if (isDatabaseUnavailableError(error)) {
        console.error("Database is unavailable while loading dashboard metrics. Rendering fallbacks.", error);
      } else {
        throw error;
      }
    }
  }

  type LatestRequest = Prisma.BloodRequestGetPayload<{
    include: {
      user: {
        select: {
          username: true;
          bloodGroup: true;
        };
      };
      _count: {
        select: {
          comments: true;
          donorResponses: true;
        };
      };
    };
  }>;

  let latestRequests: LatestRequest[] = [];

  try {
    latestRequests = await prisma.bloodRequest.findMany({
      where: hasUserId && userId !== undefined
        ? {
            OR: [{ userId }, { status: "Open" }],
          }
        : {
            status: "Open",
          },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
            bloodGroup: true,
          },
        },
        _count: {
          select: {
            comments: true,
            donorResponses: true,
          },
        },
      },
    });
  } catch (error: unknown) {
    if (isDatabaseUnavailableError(error)) {
      console.error("Database is unavailable while loading latest requests. Rendering fallback state.", error);
      latestRequests = [];
    } else {
      throw error;
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <Badge>Active Requests</Badge>
            <CardTitle className="text-3xl font-semibold text-white">{activeRequests}</CardTitle>
            <CardDescription>Requests you&apos;ve opened and are currently tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="sm" className="border border-rose-400/50" asChild>
              <Link href="/requests">Manage requests</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="success">Donor Matches</Badge>
            <CardTitle className="text-3xl font-semibold text-white">{donorResponses}</CardTitle>
            <CardDescription>Successful matches you&apos;ve facilitated or joined.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="sm" className="border border-rose-400/50" asChild>
              <Link href="/donors">View donor network</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="warning">Unread Messages</Badge>
            <CardTitle className="text-3xl font-semibold text-white">{unreadMessages}</CardTitle>
            <CardDescription>Conversations waiting for your response.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="sm" className="border border-rose-400/50" asChild>
              <Link href="/chat">Open inbox</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary">Safety Center</Badge>
            <CardTitle className="text-3xl font-semibold text-white">3</CardTitle>
            <CardDescription>Pending approvals and reports requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="sm" className="border border-rose-400/50" asChild>
              <Link href="/notifications">Review alerts</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/70 p-6 shadow-xl shadow-rose-900/30">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Latest Activity</h3>
            <p className="text-sm text-rose-100/80">Track urgent requests in the community and your contributions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" className="border border-rose-400/50" asChild>
              <Link href="/requests">View all</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/requests/new">Post new request</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-3">
          {latestRequests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/10 px-6 py-10 text-center text-sm text-rose-100/80">
              No recent activity yet. Create your first request or explore the donor network to get started.
            </div>
          )}

          {latestRequests.map((request: LatestRequest) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="group flex w-full flex-col gap-4 rounded-2xl border border-rose-500/20 bg-rose-950/70 px-5 py-4 transition hover:border-rose-400/50 hover:bg-rose-950/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-white">
                  {request.patientName} · {request.bloodGroup}
                </p>
                <p className="text-xs uppercase tracking-widest text-rose-200">{request.urgencyStatus}</p>
                <p className="text-sm text-rose-100/80">
                  Posted by {request.user.username} — needs {Number(request.amountNeeded)} units
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-rose-100/75">
                <span className="inline-flex items-center gap-1 text-xs">
                  <HeartPulse className="h-3.5 w-3.5" /> {request.upvoteCount} supports
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <Droplet className="h-3.5 w-3.5" /> {request.donorsAssigned}/{Number(request.amountNeeded)} donors
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> {request._count.comments} comments
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-600/25 via-rose-950 to-[#120005]">
          <CardHeader>
            <CardTitle className="text-white">Need guidance?</CardTitle>
            <CardDescription className="text-rose-100/85">
              Our best-practice checklist keeps you compliant and confident when managing donor outreach.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Button variant="secondary" className="border border-rose-400/50" asChild>
              <Link href="/playbooks/emergency-response">Open emergency playbook</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/25 via-rose-950 to-[#20020d]">
          <CardHeader>
            <CardTitle className="text-white">Verify your donor badge</CardTitle>
            <CardDescription className="text-rose-100/85">
              Upload medical records securely and get priority access to urgent matches in your area.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Button variant="secondary" className="border border-rose-400/50" asChild>
              <Link href="/profile/verifications">Manage verifications</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
