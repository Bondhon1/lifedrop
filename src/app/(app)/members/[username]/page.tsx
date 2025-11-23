import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl as buildImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileActionButtons, type FriendStatus } from "@/components/profile/profile-action-buttons";
import { BloodRequestCard, type BloodRequestFeedItem } from "@/components/feed/blood-request-card";
import { Mail, MapPin } from "lucide-react";

type MemberProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
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

  const viewerId = resolveViewerId(sessionUser);
  const canInteract = typeof viewerId === "number";

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
      donorApplication: { select: { status: true } },
    },
  });

  if (!member) {
    notFound();
  }

  const isSelf = canInteract ? member.id === viewerId : false;

  type FriendLookupResult = Awaited<ReturnType<typeof prisma.userFriend.findUnique>>;
  type PendingRequestResult = Awaited<ReturnType<typeof prisma.friendRequest.findFirst>>;

  let friendStatus: FriendStatus = isSelf ? "self" : "none";
  let pendingRequestId: number | null = null;
  let friendSince: string | null = null;

  if (!isSelf && canInteract) {
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
    }),
  ]);

  const displayName = member.name?.trim() && member.name.length > 0 ? member.name : member.username;
  const profileImage = buildImageUrl(member.profilePicture) ?? "/images/default-avatar.svg";
  const coverImage = buildImageUrl(member.coverPhoto) ?? "/images/default-cover.svg";
  const location = [member.upazila?.name, member.district?.name, member.division?.name]
    .filter(Boolean)
    .join(", ");

  const feedItems: BloodRequestFeedItem[] = recentRequests.map((request) => ({
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
    latitude: request.latitude ? Number(request.latitude) : null,
    longitude: request.longitude ? Number(request.longitude) : null,
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
    isOwner: member.id === viewerId,
  }));

  const isVerifiedDonor = member.donorApplication?.status === "Approved";

  return (
    <div className="grid gap-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden border-2 border-gray-200 dark:border-rose-500/20 shadow-lg bg-page">
        <div className="relative h-48 w-full bg-gradient-to-r from-rose-100 via-rose-200 to-rose-300 dark:from-rose-500/40 dark:via-rose-600/30 dark:to-rose-700/30">
          <Image
            src={coverImage}
            alt={`${displayName} cover`}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1024px, 100vw"
            priority
          />
        </div>
        
        <div className="relative px-4 pb-6 pt-20 sm:px-6 md:pt-6 bg-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {/* Avatar */}
            <div className="-mt-36 flex-shrink-0 self-center sm:-mt-44 md:mt-0 md:self-start">
              <div className="rounded-full border-4 border-white bg-gray-100 p-1 shadow-lg dark:border-rose-950/80 dark:bg-rose-900/60">
                <div className="relative h-28 w-28 overflow-hidden rounded-full bg-gray-50 dark:bg-rose-500/20 sm:h-32 sm:w-32 md:h-24 md:w-24">
                  <Image src={profileImage} alt={`${displayName} avatar`} fill className="object-cover" sizes="96px" priority />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="grid flex-1 gap-3 text-center md:text-left">
              <div className="space-y-1">
                {member.name && member.name.trim().length > 0 && (
                  <p className="text-base font-semibold text-primary sm:text-lg flex items-center justify-center md:justify-start gap-1">
                    {member.name}
                    {isVerifiedDonor && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold ml-1 align-middle border border-green-300" title="Verified donor">
                        <svg className="w-3 h-3 mr-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    )}
                  </p>
                )}
                <h1 className="text-base font-bold text-primary sm:text-2xl">@{member.username}</h1>
              </div>

              <div className="flex flex-wrap justify-center gap-3 text-sm text-secondary md:justify-start">
                {member.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-muted" />
                    <span>{member.email}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted" />
                    <span>{location}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {member.bloodGroup && (
                  <Badge className="bg-rose-100 text-rose-900 dark:bg-rose-500/30 dark:text-rose-50">
                    {member.bloodGroup}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-muted">
                  {friendCount} {friendCount === 1 ? "friend" : "friends"}
                </Badge>
                <Badge variant="secondary" className="text-muted">
                  Joined {formatJoinedDate(member.createdAt)}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-shrink-0 justify-center md:w-auto md:justify-end">
              {canInteract ? (
                <ProfileActionButtons
                  status={friendStatus}
                  targetUserId={member.id}
                  pendingRequestId={pendingRequestId}
                  friendSince={friendSince}
                  targetDisplayName={displayName}
                />
              ) : (
                <p className="text-sm text-muted">Admins can view member profiles but social actions are disabled.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Requests */}
      <section className="grid gap-4">
        <h2 className="text-xl font-bold text-primary">Recent blood requests</h2>
        {feedItems.length === 0 ? (
          <Card className="border-2 border-dashed border-soft bg-surface-card">
            <CardContent className="p-8 text-center text-secondary">
              No blood requests from {displayName.split(" ")[0]} yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5">
            {feedItems.map((item) => (
              <BloodRequestCard key={item.id} request={item} showFullReason={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function resolveViewerId(user: SessionUser): number | null {
  if (user.isAdmin) {
    return null;
  }

  const rawId = user.id;

  if (typeof rawId === "number" && Number.isInteger(rawId)) {
    return rawId;
  }

  if (typeof rawId === "string") {
    if (/^\d+$/.test(rawId)) {
      return Number(rawId);
    }
  }

  return null;
}
