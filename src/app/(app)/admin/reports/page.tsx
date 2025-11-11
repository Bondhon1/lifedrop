import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportQueue, type AdminReportSummary } from "@/components/admin/report-queue";

export default async function AdminReportsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/feed");
  }

  const [openReports, reports] = await Promise.all([
    prisma.report.count(),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            username: true,
            name: true,
            email: true,
          },
        },
        bloodRequest: {
          select: {
            id: true,
            patientName: true,
            status: true,
            hospitalName: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const reportedUserIds = Array.from(
    new Set(
      reports
        .map((report) => report.postId)
        .filter((value): value is number => typeof value === "number" && Number.isInteger(value)),
    ),
  );

  const reportedUsers = reportedUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reportedUserIds } },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          bloodGroup: true,
          donorApplication: {
            select: {
              status: true,
            },
          },
        },
      })
    : [];

  const userLookup = new Map(reportedUsers.map((user) => [user.id, user]));

  const serialisedReports: AdminReportSummary[] = reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    createdAt: report.createdAt.toISOString(),
    reporter: report.reporter
      ? {
          username: report.reporter.username,
          name: report.reporter.name,
          email: report.reporter.email,
        }
      : null,
    request: report.bloodRequest
      ? {
          id: report.bloodRequest.id,
          patientName: report.bloodRequest.patientName,
          status: report.bloodRequest.status,
          hospitalName: report.bloodRequest.hospitalName,
          author: report.bloodRequest.user?.name ?? report.bloodRequest.user?.username ?? "Unknown",
        }
      : null,
    member: (() => {
      if (typeof report.postId !== "number") {
        return null;
      }
      const target = userLookup.get(report.postId);
      if (!target) {
        return null;
      }
      return {
        id: target.id,
        username: target.username,
        name: target.name,
        email: target.email,
        bloodGroup: target.bloodGroup,
        donorStatus: target.donorApplication?.status ?? null,
      };
    })(),
  }));

  const flaggedRequests = serialisedReports.filter((report) => report.request).length;
  const flaggedProfiles = serialisedReports.filter((report) => report.member).length;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-primary">Reports queue</h1>
        <p className="text-sm text-secondary">
          Investigate flagged requests, remove harmful content, and clear resolved reports to keep the platform trustworthy.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary">Open reports</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">{openReports}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary">Requests flagged</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">{flaggedRequests}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-secondary">Profiles flagged</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-primary">{flaggedProfiles}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold text-primary">Flagged activity</h2>
          <p className="text-sm text-secondary">Review context, escalate if needed, or resolve when everything checks out.</p>
        </div>
        <ReportQueue reports={serialisedReports} />
      </section>
    </div>
  );
}
