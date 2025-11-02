import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDirectoryTable, type AdminUserSummary } from "@/components/admin/user-directory-table";

export default async function AdminUserDirectoryPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [totalUsers, newThisWeek, approvedDonors, pendingDonors, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.donorApplication.count({ where: { status: "Approved" } }),
    prisma.donorApplication.count({ where: { status: "Pending" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        bloodGroup: true,
        profilePicture: true,
        createdAt: true,
        role: true,
        donorApplication: { select: { status: true } },
        _count: {
          select: {
            bloodRequests: true,
            donorResponses: true,
          },
        },
      },
    }),
  ]);

  const serialisedUsers: AdminUserSummary[] = users.map((member) => ({
    id: member.id,
    username: member.username,
    name: member.name,
    email: member.email,
    phone: member.phone,
    bloodGroup: member.bloodGroup,
    profilePicture: member.profilePicture,
    createdAt: member.createdAt.toISOString(),
    role: member.role,
    donorStatus: member.donorApplication?.status ?? null,
    requestCount: member._count.bloodRequests,
    responseCount: member._count.donorResponses,
  }));

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Member directory</h1>
        <p className="text-sm text-[#5F5F5F]">
          Review community activity, verify donor eligibility, and keep the platform free from duplicate or suspicious accounts.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Total members</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Joined this week</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{newThisWeek}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Approved donors</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{approvedDonors}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Pending donor reviews</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{pendingDonors}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold text-[#2E2E2E]">Community members</h2>
          <p className="text-sm text-[#5F5F5F]">Search, review, and manage user accounts.</p>
        </div>
        <UserDirectoryTable users={serialisedUsers} />
      </section>
    </div>
  );
}
