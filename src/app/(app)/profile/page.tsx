import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/utils";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { bloodGroups } from "@/lib/validators/blood-request";
import { ProfileBannerEditable } from "@/components/profile/profile-banner-editable";

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
  const lastUpdatedLabel = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(user.updatedAt);

  const locationOptions = {
    divisions: divisions.map((division) => ({ id: division.id, name: division.name })),
    districts: districts.map((district) => ({ id: district.id, name: district.name, divisionId: district.divisionId })),
    upazilas: upazilas.map((upazila) => ({ id: upazila.id, name: upazila.name, districtId: upazila.districtId })),
  } as const;

  return (
    <div className="grid gap-8">
      <ProfileBannerEditable
        displayName={user.name ?? user.username}
        username={user.username}
        email={user.email}
        lastUpdatedLabel={lastUpdatedLabel}
        profilePictureUrl={displayProfilePictureUrl}
        coverPhotoUrl={displayCoverPhotoUrl}
      />

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

    </div>
  );
}
