import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BloodRequestCard, type BloodRequestFeedItem } from "@/components/feed/blood-request-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { CommentThread } from "@/components/comments/comment-thread";
import { BloodRequestMap, type BloodRequestMapPoint, DonorResponseActions } from "@/components/requests";

const BLOOD_COMPATIBILITY: Record<string, readonly string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
} as const;

type RequestDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const resolvedParams = await params;
  const requestId = Number(resolvedParams.requestId);
  if (!Number.isInteger(requestId)) {
    notFound();
  }

  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser) {
    notFound();
  }

  const userId = Number(sessionUser.id);

  // Get viewer's profile with donor application status
  const viewerProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bloodGroup: true,
      donorApplication: {
        select: {
          status: true,
          lastDonationDate: true,
        },
      },
    },
  });

  const bloodRequest = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          bloodGroup: true,
          email: true,
          phone: true,
        },
      },
      upvotes: {
        where: {
          userId,
        },
        select: { id: true },
      },
      donorResponses: {
        select: {
          id: true,
          donorId: true,
          createdAt: true,
          status: true,
          donor: {
            select: {
              username: true,
              name: true,
              bloodGroup: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      division: {
        select: {
          name: true,
        },
      },
      district: {
        select: {
          name: true,
        },
      },
      upazila: {
        select: {
          name: true,
        },
      },
      comments: {
        select: {
          id: true,
          text: true,
          createdAt: true,
          userId: true,
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
              likes: true,
            },
          },
          likes: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!bloodRequest) {
    notFound();
  }

  // Check if viewer is an approved donor
  const viewerIsApprovedDonor = viewerProfile?.donorApplication?.status === "Approved";
  const viewerLastDonationDate = viewerProfile?.donorApplication?.lastDonationDate;
  const viewerBloodGroup = viewerProfile?.bloodGroup;

  // Calculate eligibility for this specific request
  let viewerCanRespond = false;
  let viewerBlockedReason: string | null = null;
  let viewerResponseStatus: "Pending" | "Accepted" | "Declined" | undefined = undefined;

  // Check if viewer has already responded
  const existingResponse = bloodRequest.donorResponses.find(
    (response: (typeof bloodRequest.donorResponses)[number]) => response.donorId === userId
  );
  if (existingResponse) {
    viewerResponseStatus = existingResponse.status as "Pending" | "Accepted" | "Declined";
  }

  if (viewerIsApprovedDonor && bloodRequest.user.id !== userId) {
    // Check blood group compatibility
    const donorCanDonateToPatient =
      viewerBloodGroup && BLOOD_COMPATIBILITY[viewerBloodGroup]?.includes(bloodRequest.bloodGroup);

    if (!donorCanDonateToPatient) {
      viewerBlockedReason = `Your blood group (${viewerBloodGroup}) cannot donate to ${bloodRequest.bloodGroup}`;
    } else if (viewerLastDonationDate) {
      // Check 90-day gap
      const daysSinceLastDonation = Math.floor(
        (Date.now() - new Date(viewerLastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastDonation < 90) {
        const daysRemaining = 90 - daysSinceLastDonation;
        viewerBlockedReason = `You must wait ${daysRemaining} more day${daysRemaining !== 1 ? "s" : ""} before donating again`;
      } else {
        viewerCanRespond = true;
      }
    } else {
      // No previous donation, can donate
      viewerCanRespond = true;
    }
  }

  const feedItem: BloodRequestFeedItem = {
    id: bloodRequest.id,
    patientName: bloodRequest.patientName,
    gender: bloodRequest.gender,
    requiredDate: bloodRequest.requiredDate.toISOString(),
    bloodGroup: bloodRequest.bloodGroup,
    amountNeeded: Number(bloodRequest.amountNeeded),
    hospitalName: bloodRequest.hospitalName,
    urgencyStatus: bloodRequest.urgencyStatus,
    smokerPreference: bloodRequest.smokerPreference,
    reason: bloodRequest.reason,
    location: bloodRequest.location,
    latitude: bloodRequest.latitude,
    longitude: bloodRequest.longitude,
    divisionName: bloodRequest.division?.name ?? null,
    districtName: bloodRequest.district?.name ?? null,
    upazilaName: bloodRequest.upazila?.name ?? null,
    status: bloodRequest.status,
    createdAt: bloodRequest.createdAt.toISOString(),
    updatedAt: bloodRequest.updatedAt.toISOString(),
    upvotes: bloodRequest.upvoteCount,
    commentCount: bloodRequest._count.comments,
    donorsAssigned: bloodRequest.donorsAssigned,
    owner: {
      id: bloodRequest.user.id,
      username: bloodRequest.user.username,
      name: bloodRequest.user.name,
      bloodGroup: bloodRequest.user.bloodGroup,
    },
    hasUpvoted: bloodRequest.upvotes.length > 0,
    hasResponded: bloodRequest.donorResponses.some((response: (typeof bloodRequest.donorResponses)[number]) => response.donorId === userId),
    isOwner: bloodRequest.user.id === userId,
    viewerIsApprovedDonor,
    viewerCanRespond,
    viewerBlockedReason,
    viewerResponseStatus,
  };

  const hasCoordinates = typeof feedItem.latitude === "number" && typeof feedItem.longitude === "number";
  const coordinateLabel = hasCoordinates ? `${(feedItem.latitude as number).toFixed(4)}, ${(feedItem.longitude as number).toFixed(4)}` : null;
  const locationLabel = (() => {
    const trimmed = bloodRequest.location?.trim() ?? "";
    if (trimmed.length > 0) {
      return trimmed;
    }
    return coordinateLabel ?? "Location unavailable";
  })();

  const mapLink = hasCoordinates ? `https://www.google.com/maps?q=${feedItem.latitude},${feedItem.longitude}` : null;

  const mapPoints: BloodRequestMapPoint[] = hasCoordinates
    ? [
        {
          id: feedItem.id,
          patientName: feedItem.patientName,
          hospitalName: feedItem.hospitalName,
          bloodGroup: feedItem.bloodGroup,
          urgencyStatus: feedItem.urgencyStatus,
          location: feedItem.location,
          latitude: feedItem.latitude as number,
          longitude: feedItem.longitude as number,
        },
      ]
    : [];

  const donorResponses = bloodRequest.donorResponses;

  const comments = bloodRequest.comments.map((comment: (typeof bloodRequest.comments)[number]) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    likeCount: comment._count.likes,
    likedByViewer: comment.likes.length > 0,
    author: {
      id: comment.user.id,
      username: comment.user.username,
      name: comment.user.name,
      bloodGroup: comment.user.bloodGroup,
    },
  }));

  return (
    <div className="grid gap-6">
      <BloodRequestCard request={feedItem} showFullReason />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border border-soft bg-surface-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Hospital location</CardTitle>
          </CardHeader>
          <CardContent>
            {mapPoints.length > 0 ? (
              <BloodRequestMap requests={mapPoints} className="h-[22rem] w-full rounded-3xl" />
            ) : (
              <div className="flex h-[22rem] w-full items-center justify-center rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft text-sm text-secondary">
                Exact GPS coordinates have not been provided for this request yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-soft bg-surface-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">Location details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-secondary">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Hospital</dt>
                  <dd className="text-base text-primary">{bloodRequest.hospitalName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Location</dt>
                  <dd className="text-base text-primary">
                    {locationLabel}
                    {mapLink ? (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-accent)] underline-offset-4 hover:text-[var(--color-text-accent-hover)] hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> View map
                      </a>
                    ) : null}
                  </dd>
                </div>
                {coordinateLabel && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Coordinates</dt>
                    <dd className="text-base text-primary">{coordinateLabel}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {bloodRequest.images.length > 0 && (
            <Card className="border border-soft bg-surface-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-primary">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {bloodRequest.images.map((image) => (
                    <div key={image} className="overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft">
                      <Image
                        src={image}
                        alt={`Attachment for ${bloodRequest.patientName}`}
                        width={640}
                        height={360}
                        unoptimized
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <Card className="border border-soft bg-surface-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Donor responses</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-secondary">
            {donorResponses.length === 0 ? (
              <p className="text-sm text-secondary">No donors have responded yet. Share this request to reach more people.</p>
            ) : (
              donorResponses.map((response: typeof donorResponses[number]) => (
                <div
                  key={response.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/members/${response.donor.username}`}
                      className="text-sm font-semibold text-primary underline-offset-4 hover:text-[var(--color-text-accent)] hover:underline"
                    >
                      {response.donor.name ?? response.donor.username}
                    </Link>
                    <p className="text-xs text-muted">Responded on {new Date(response.createdAt).toLocaleString()}</p>
                    {response.status !== "Pending" && (
                      <p className="text-xs font-semibold mt-1 text-primary">
                        Status: <span className={response.status === "Accepted" ? "text-green-600" : "text-red-600"}>{response.status}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex min-w-[3rem] justify-center rounded-full border border-[var(--color-border-primary)] bg-surface-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {response.donor.bloodGroup ?? "Unknown"}
                    </span>
                    {bloodRequest.user.id === userId && response.status === "Pending" && (
                      <DonorResponseActions
                        responseId={response.id}
                        donorId={response.donorId}
                        requestId={bloodRequest.id}
                        donorName={response.donor.name ?? response.donor.username}
                        donorEmail={response.donor.email}
                        donorPhone={response.donor.phone}
                        requesterEmail={bloodRequest.user.email}
                        requesterPhone={bloodRequest.user.phone}
                        requesterName={bloodRequest.user.name ?? bloodRequest.user.username}
                        patientName={bloodRequest.patientName}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4" id="comments">
        <Card className="border border-soft bg-surface-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Comments</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-secondary">
            <CommentThread requestId={bloodRequest.id} comments={comments} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
