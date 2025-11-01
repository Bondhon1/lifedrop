import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileActionButtons, type FriendStatus } from "@/components/profile/profile-action-buttons";

type MemberProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

const buildImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

const formatJoinedDate = (value: Date) => {
  try {
    return value.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  } catch (error) {
    return value.toISOString();
  }
};

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { username } = await params;
  if (!username || username.length < 2) {
    notFound();
  }

  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser) {
    redirect("/login");
  }

  const viewerId = Number(sessionUser.id);
  if (!Number.isInteger(viewerId)) {
    redirect("/login");
  }

  const member = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      bloodGroup: true,
      medicalHistory: true,
      profilePicture: true,
      coverPhoto: true,
      createdAt: true,
      division: { select: { name: true } },
      district: { select: { name: true } },
      upazila: { select: { name: true } },
    },
  });

  if (!member) {
    notFound();
  }

  const isSelf = member.id === viewerId;

  type FriendLookupResult = Awaited<ReturnType<typeof prisma.userFriend.findUnique>>;
  type PendingRequestResult = Awaited<ReturnType<typeof prisma.friendRequest.findFirst>>;

  let friendStatus: FriendStatus = isSelf ? "self" : "none";
  let pendingRequestId: number | null = null;
  let friendSince: string | null = null;

  if (!isSelf) {
    const [friendship, pendingRequest] = await Promise.all([
      prisma.userFriend.findUnique({
        where: {
          userId_friendId: {
            userId: viewerId,
            friendId: member.id,
          },
        },
      }),
      prisma.friendRequest.findFirst({
        where: {
          status: "pending",
          OR: [
            { senderId: viewerId, receiverId: member.id },
            { senderId: member.id, receiverId: viewerId },
          ],
        },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
        },
      }),
    ] as const);

    if (friendship) {
      friendStatus = "friends";
      friendSince = friendship.createdAt.toISOString();
    } else if (pendingRequest) {
      pendingRequestId = pendingRequest.id;
      friendStatus = pendingRequest.senderId === viewerId ? "outgoing" : "incoming";
    }
  }

  const [requestCount, donationCount, friendCount, recentRequests] = await Promise.all([
    prisma.bloodRequest.count({ where: { userId: member.id } }),
    prisma.donorResponse.count({ where: { donorId: member.id } }),
    prisma.userFriend.count({ where: { userId: member.id } }),
    prisma.bloodRequest.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        patientName: true,
        urgencyStatus: true,
        bloodGroup: true,
        requiredDate: true,
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const displayName = member.name?.trim() && member.name.length > 0 ? member.name : member.username;
  const profileImage = buildImageUrl(member.profilePicture) ?? "/images/default-avatar.svg";
  const coverImage = buildImageUrl(member.coverPhoto) ?? "/images/default-cover.svg";
  const location = [member.upazila?.name, member.district?.name, member.division?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-3xl border border-rose-500/20 bg-rose-950/70 shadow-2xl shadow-rose-900/40">
        <div className="relative h-48 w-full bg-gradient-to-r from-rose-500/40 via-rose-600/30 to-rose-700/30">
          <Image
            src={coverImage}
            alt={`${displayName} cover`}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1024px, 100vw"
            priority
          />
        </div>
        <div className="grid gap-6 px-6 pb-8 md:grid-cols-[auto_1fr] md:items-end">
          <div className="-mt-14 flex items-end">
            <div className="rounded-full border-4 border-rose-950/80 bg-rose-900/60 p-1 shadow-2xl shadow-rose-900/40">
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-rose-500/20">
                <Image src={profileImage} alt={`${displayName} avatar`} fill className="object-cover" sizes="112px" priority />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <h1 className="text-3xl font-semibold text-white">{displayName}</h1>
              <p className="text-sm text-rose-100/80">@{member.username}</p>
              {location ? <p className="text-sm text-rose-100/70">{location}</p> : null}
              <div className="flex flex-wrap items-center gap-2 text-sm text-rose-100/80">
                <Badge variant="secondary">Joined {formatJoinedDate(member.createdAt)}</Badge>
                {member.bloodGroup ? (
                  <Badge className="bg-rose-500/30 text-rose-50">Blood group {member.bloodGroup}</Badge>
                ) : null}
                <Badge variant="secondary">{friendCount} {friendCount === 1 ? "friend" : "friends"}</Badge>
              </div>
            </div>

            <ProfileActionButtons
              status={friendStatus}
              targetUserId={member.id}
              pendingRequestId={pendingRequestId}
              friendSince={friendSince}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-rose-500/20 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">About {displayName.split(" ")[0]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-rose-100/80">
            <div className="grid gap-1">
              <p className="font-semibold text-white">Contact details</p>
              <p>Email: <span className="text-rose-100/70">{member.email ?? "Not shared"}</span></p>
              <p>Phone: <span className="text-rose-100/70">{member.phone ?? "Not shared"}</span></p>
              <p>Address: <span className="text-rose-100/70">{member.address ?? "Not shared"}</span></p>
            </div>
            <div className="grid gap-1">
              <p className="font-semibold text-white">Medical notes</p>
              <p className="whitespace-pre-wrap text-rose-100/70">
                {member.medicalHistory ? member.medicalHistory : "No medical details shared yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-rose-500/20 bg-rose-950/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm text-rose-50">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <dt className="text-xs uppercase tracking-widest text-rose-200/80">Requests created</dt>
                <dd className="text-2xl font-semibold text-white">{requestCount}</dd>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <dt className="text-xs uppercase tracking-widest text-emerald-200/80">Donations pledged</dt>
                <dd className="text-2xl font-semibold text-white">{donationCount}</dd>
              </div>
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                <dt className="text-xs uppercase tracking-widest text-sky-200/80">Connections</dt>
                <dd className="text-2xl font-semibold text-white">{friendCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent blood requests</h2>
          <Link href={`/requests?user=${member.username}`} className="text-sm text-rose-100/80 underline-offset-4 hover:underline">
            View more
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100/80">
            No blood requests from {displayName.split(" ")[0]} yet.
          </p>
        ) : (
          <ul className="grid gap-3">
            {recentRequests.map((request: (typeof recentRequests)[number]) => (
              <li
                key={request.id}
                className="flex flex-col gap-2 rounded-2xl border border-rose-500/20 bg-rose-950/70 p-4 shadow-lg shadow-rose-900/30 md:flex-row md:items-center md:justify-between"
              >
                <div className="grid gap-1 text-sm text-rose-100/80">
                  <Link href={`/requests/${request.id}`} className="text-base font-semibold text-white hover:underline">
                    {request.patientName}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-rose-100/60">
                    <span>{request.bloodGroup}</span>
                    <span>{request.urgencyStatus}</span>
                    <span>Required {request.requiredDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {request.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
