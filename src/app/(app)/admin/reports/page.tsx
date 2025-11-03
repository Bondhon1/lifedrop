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
  }));

  const flaggedRequests = serialisedReports.filter((report) => report.request).length;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Reports queue</h1>
        <p className="text-sm text-[#5F5F5F]">
          Investigate flagged requests, remove harmful content, and clear resolved reports to keep the platform trustworthy.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Open reports</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{openReports}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Requests flagged</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{flaggedRequests}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold text-[#2E2E2E]">Flagged activity</h2>
          <p className="text-sm text-[#5F5F5F]">Review context, escalate if needed, or resolve when everything checks out.</p>
        </div>
        <ReportQueue reports={serialisedReports} />
      </section>
    </div>
  );
}
