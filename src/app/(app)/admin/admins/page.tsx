import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import { AdminDirectory, type AdminSummary } from "@/components/admin/admin-directory";
import { Card, CardContent } from "@/components/ui/card";

function resolveAdminId(user: SessionUser | undefined): number | null {
  if (!user) return null;
  if (typeof user.id === "string" && user.id.startsWith("admin:")) {
    const parsed = Number(user.id.split(":")[1]);
    return Number.isInteger(parsed) ? parsed : null;
  }
  const parsed = Number(user.id);
  return Number.isInteger(parsed) ? parsed : null;
}

export default async function AdminManageAdminsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  const currentAdminId = resolveAdminId(user);

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  const serialisedAdmins: AdminSummary[] = admins.map((admin) => ({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    createdAt: admin.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Admin accounts</h1>
        <p className="text-sm text-[#5F5F5F]">
          Invite additional administrators, track who has elevated access, and remove stale accounts when teammates roll off.
        </p>
      </header>

      <AddAdminForm existingCount={serialisedAdmins.length} />

      <section className="grid gap-3">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold text-[#2E2E2E]">Active admins</h2>
          <p className="text-sm text-[#5F5F5F]">Keep this list short and ensure each admin uses a strong unique password.</p>
        </div>
        {serialisedAdmins.length === 0 ? (
          <Card className="border border-rose-500/25 bg-rose-950/70">
            <CardContent className="p-6 text-sm text-rose-100/80">
              You do not have any admin accounts yet. Use the form above to invite your first teammate.
            </CardContent>
          </Card>
        ) : (
          <AdminDirectory admins={serialisedAdmins} currentAdminId={currentAdminId} />
        )}
      </section>
    </div>
  );
}
