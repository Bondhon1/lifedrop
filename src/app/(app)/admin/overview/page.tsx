import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECENT_LIMIT = 6;

export default async function AdminOverviewPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/feed");
  }

  const [
    totalUsers,
    totalRequests,
    openRequests,
    fulfilledRequests,
    donorResponses,
    pendingApplications,
    unresolvedReports,
    latestRequests,
    latestReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.bloodRequest.count(),
    prisma.bloodRequest.count({ where: { status: "Open" } }),
    prisma.bloodRequest.count({ where: { status: "Fulfilled" } }),
    prisma.donorResponse.count(),
    prisma.donorApplication.count({ where: { status: "Pending" } }),
  prisma.report.count(),
    prisma.bloodRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        patientName: true,
        urgencyStatus: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        createdAt: true,
        reason: true,
        bloodRequest: {
          select: {
            id: true,
            patientName: true,
          },
        },
        reporter: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Admin Console</h1>
        <p className="text-sm text-[#5F5F5F]">Monitor platform health, review escalated requests, and keep the community safe.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Total members</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Open requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{openRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Fulfilled requests</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{fulfilledRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Donor pledges</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{donorResponses}</CardContent>
        </Card>
        <Link href="/admin/donors" className="group block">
          <Card className="cursor-pointer transition group-hover:border-[#D31027]/30 group-hover:bg-[#D31027]/8">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Pending donor applications</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{pendingApplications}</CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Reports awaiting review</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{unresolvedReports}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-rose-500/20 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Latest blood requests</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {latestRequests.length === 0 ? (
              <p className="text-sm text-rose-100/80">No requests have been created yet.</p>
            ) : (
              latestRequests.map((request: (typeof latestRequests)[number]) => (
                <div key={request.id} className="rounded-2xl border border-rose-500/20 bg-rose-950/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{request.patientName}</p>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <p className="text-xs text-rose-100/75">
                    Raised by {request.user.name ?? request.user.username} · {format(request.createdAt, "MMM d, yyyy h:mm a")}
                  </p>
                  <p className="mt-2 text-xs text-rose-100/60">Urgency: {request.urgencyStatus}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-rose-500/20 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Recent reports</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {latestReports.length === 0 ? (
              <p className="text-sm text-rose-100/80">No reports submitted.</p>
            ) : (
              latestReports.map((report: (typeof latestReports)[number]) => (
                <div key={report.id} className="rounded-2xl border border-rose-500/20 bg-rose-950/70 px-4 py-3">
                  <p className="text-sm font-semibold text-white">{report.reason}</p>
                  <p className="text-xs text-rose-100/75">
                    Related to request #{report.bloodRequest?.id ?? "N/A"} · {report.bloodRequest?.patientName ?? "Unknown"}
                  </p>
                  <p className="mt-2 text-xs text-rose-100/60">
                    Reported by {report.reporter?.name ?? report.reporter?.username ?? "Anonymous"} · {format(report.createdAt, "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
