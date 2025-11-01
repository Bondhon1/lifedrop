import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingDonorApplicationsList, type PendingDonorApplication } from "@/components/admin/pending-donor-applications-list";

export default async function AdminDonorModerationPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  const [pendingCount, approvedCount, rejectedCount, applications] = await Promise.all([
    prisma.donorApplication.count({ where: { status: "Pending" } }),
    prisma.donorApplication.count({ where: { status: "Approved" } }),
    prisma.donorApplication.count({ where: { status: "Rejected" } }),
    prisma.donorApplication.findMany({
      where: { status: "Pending" },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            phone: true,
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

  const serializedApplications: PendingDonorApplication[] = applications.map((application) => ({
    id: application.id,
    submittedAt: application.createdAt.toISOString(),
    dateOfBirth: application.dateOfBirth.toISOString(),
    hasDonatedBefore: application.hasDonatedBefore,
    lastDonationDate: application.lastDonationDate ? application.lastDonationDate.toISOString() : null,
    medicalConditions: application.medicalConditions ?? null,
    medicalHistoryImages: application.medicalHistoryImages,
    nidOrBirthCertificate: application.nidOrBirthCertificate,
    status: application.status,
    user: {
      id: application.user.id,
      username: application.user.username,
      name: application.user.name,
      email: application.user.email,
      phone: application.user.phone,
      bloodGroup: application.user.bloodGroup,
      division: application.user.division?.name ?? null,
      district: application.user.district?.name ?? null,
      upazila: application.user.upazila?.name ?? null,
      profilePicture: application.user.profilePicture,
    },
  }));

  const applicationsReviewed = approvedCount + rejectedCount;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Donor moderation</h1>
        <p className="text-sm text-[#5F5F5F]">
          Review new donor submissions, verify documentation, and keep the network ready for urgent requests.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border border-rose-500/25 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-rose-100/80">Pending reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-white">{pendingCount}</CardContent>
        </Card>
        <Card className="border border-emerald-500/25 bg-emerald-500/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#1C6F4A]">Approved donors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#0F3F29]">{approvedCount}</CardContent>
        </Card>
        <Card className="border border-amber-500/25 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#7A4C00]">Applications reviewed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#503100]">{applicationsReviewed}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#2E2E2E]">Pending applications</h2>
          <p className="text-sm text-[#5F5F5F]">Inspect the applicant documentation before approving them for the donor network.</p>
        </div>
        <PendingDonorApplicationsList applications={serializedApplications} />
      </section>
    </div>
  );
}
