import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { ProfileImageForm } from "@/components/profile/profile-image-form";
import { Avatar } from "@/components/ui/avatar";
import { bloodGroups } from "@/lib/validators/blood-request";

const resolveImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

export default async function ProfilePage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser) {
    redirect("/login");
  }

  const userId = Number(sessionUser.id);
  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const [user, divisions, districts, upazilas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        bloodGroup: true,
        medicalHistory: true,
        divisionId: true,
        districtId: true,
        upazilaId: true,
        profilePicture: true,
        coverPhoto: true,
        updatedAt: true,
      },
    }),
    prisma.divisions.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.districts.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, divisionId: true },
    }),
    prisma.upazilas.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, districtId: true },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const profilePictureUrl = resolveImageUrl(user.profilePicture);
  const coverPhotoUrl = resolveImageUrl(user.coverPhoto);
  const displayProfilePictureUrl = profilePictureUrl ?? "/images/default-avatar.svg";
  const displayCoverPhotoUrl = coverPhotoUrl ?? "/images/default-cover.svg";

  const locationOptions = {
    divisions: divisions.map((division) => ({ id: division.id, name: division.name })),
    districts: districts.map((district) => ({ id: district.id, name: district.name, divisionId: district.divisionId })),
    upazilas: upazilas.map((upazila) => ({ id: upazila.id, name: upazila.name, districtId: upazila.districtId })),
  } as const;

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-3xl border border-soft bg-surface-card shadow-soft">
        <div className="relative h-48 w-full">
          <Image src={displayCoverPhotoUrl} alt="Cover photo" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              src={displayProfilePictureUrl}
              alt={user.name ?? user.username}
              size="lg"
              className="h-24 w-24 border-4 border-[var(--color-border-primary)] bg-surface-card-muted shadow-soft"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-primary">{user.name ?? user.username}</h1>
              <p className="truncate text-sm text-secondary">{user.email}</p>
              <p className="mt-1 text-xs text-muted">Last updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(user.updatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <ProfileInfoForm
        profile={{
          name: user.name ?? "",
          username: user.username,
          email: user.email,
          phone: user.phone ?? "",
          address: user.address ?? "",
          bloodGroup: user.bloodGroup ?? "",
          medicalHistory: user.medicalHistory ?? "",
          divisionId: user.divisionId ?? null,
          districtId: user.districtId ?? null,
          upazilaId: user.upazilaId ?? null,
        }}
        bloodGroups={bloodGroups}
        locationOptions={locationOptions}
      />

      <ProfileImageForm profilePictureUrl={profilePictureUrl} coverPhotoUrl={coverPhotoUrl} />
    </div>
  );
}
