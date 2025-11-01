import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BloodRequestCard, type BloodRequestFeedItem } from "@/components/feed/blood-request-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RequestsPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser) {
    redirect("/login");
  }

  const userId = Number(sessionUser.id);

  const requests = await prisma.bloodRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          bloodGroup: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const feedItems: BloodRequestFeedItem[] = requests.map((request: (typeof requests)[number]) => ({
    id: request.id,
    patientName: request.patientName,
    gender: request.gender,
    requiredDate: request.requiredDate.toISOString(),
    bloodGroup: request.bloodGroup,
    amountNeeded: Number(request.amountNeeded),
    hospitalName: request.hospitalName,
    urgencyStatus: request.urgencyStatus,
    smokerPreference: request.smokerPreference,
    reason: request.reason,
    location: request.location,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    upvotes: request.upvoteCount,
    commentCount: request._count.comments,
    donorsAssigned: request.donorsAssigned,
    owner: {
      id: request.user.id,
      username: request.user.username,
      name: request.user.name,
      bloodGroup: request.user.bloodGroup,
    },
    hasUpvoted: false,
    hasResponded: false,
    isOwner: true,
  }));

  const openRequests = feedItems.filter((item) => item.status === "Open").length;
  const fulfilledRequests = feedItems.filter((item) => item.status === "Fulfilled").length;
  const totalSupports = feedItems.reduce((sum, item) => sum + item.upvotes, 0);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2E2E2E]">Your blood requests</h1>
          <p className="text-sm text-[#5F5F5F]">
            Track the status of every request you&apos;ve created and keep donors informed.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="border border-rose-400/50" asChild>
            <Link href="/feed">View community feed</Link>
          </Button>
          <Button asChild>
            <Link href="/requests/new">Create new request</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Open requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{openRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Fulfilled</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{fulfilledRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Total supports received</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{totalSupports}</CardContent>
        </Card>
      </section>

      <section className="grid gap-5">
        {feedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rose-500/30 bg-rose-500/10 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">No active requests yet</h2>
            <p className="mt-2 text-sm text-rose-100/80">
              When you publish blood requests you can manage every update from here.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link href="/requests/new">Create your first request</Link>
              </Button>
            </div>
          </div>
        ) : (
          feedItems.map((item) => (
            <div key={item.id} className="grid w-full gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F5F5F]">
                <Badge variant="secondary">#{item.id}</Badge>
                <span>Created {new Date(item.createdAt).toLocaleString()}</span>
                <span>Updated {new Date(item.updatedAt ?? item.createdAt).toLocaleString()}</span>
              </div>
              <BloodRequestCard request={item} showFullReason />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
