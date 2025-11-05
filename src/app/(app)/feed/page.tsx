import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BloodRequestCard, type BloodRequestFeedItem } from "@/components/feed/blood-request-card";

const PAGE_SIZE = 6;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const URGENCY_OPTIONS = ["Normal", "Urgent", "Critical"] as const;

const bloodRequestInclude = {
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      bloodGroup: true,
    },
  },
  division: {
    select: {
      name: true,
      latitude: true,
      longitude: true,
    },
  },
  district: {
    select: {
      name: true,
      latitude: true,
      longitude: true,
    },
  },
  upazila: {
    select: {
      name: true,
      latitude: true,
      longitude: true,
    },
  },
  upvotes: {
    select: {
      id: true,
    },
  },
  donorResponses: {
    select: {
      id: true,
    },
  },
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.BloodRequestInclude;

type BloodRequestWithRelations = Prisma.BloodRequestGetPayload<{ include: typeof bloodRequestInclude }>;

type Coordinates = {
  lat: number;
  lng: number;
};

type ViewerContext = {
  coordinates: Coordinates | null;
  bloodGroup: string | null;
  address: string | null;
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
  divisionName: string | null;
  districtName: string | null;
  upazilaName: string | null;
};

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

const URGENCY_SCORES: Record<string, number> = {
  Normal: 12,
  Urgent: 28,
  Critical: 45,
};

const EARTH_RADIUS_KM = 6371;

const MAX_DISTANCE_PRIORITY_KM = 200;
const UPCOMING_WINDOW_HOURS = 120;
const RECENCY_WINDOW_HOURS = 168;
const PAST_DATE_PENALTY = 140;
const NON_OPEN_STATUS_PENALTY = 80;

const toRadians = (value: number) => (value * Math.PI) / 180;

const computeDistanceKm = (a: Coordinates, b: Coordinates) => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_KM * c;
};

const extractCoordinates = (value?: { latitude: number | null; longitude: number | null } | null): Coordinates | null => {
  if (typeof value?.latitude === "number" && typeof value.longitude === "number") {
    return { lat: value.latitude, lng: value.longitude };
  }
  return null;
};

const getUserContext = (profile: {
  bloodGroup: string | null;
  address: string | null;
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
  division: { name: string | null; latitude: number | null; longitude: number | null } | null;
  district: { name: string | null; latitude: number | null; longitude: number | null } | null;
  upazila: { name: string | null; latitude: number | null; longitude: number | null } | null;
} | null): ViewerContext => {
  if (!profile) {
    return {
      coordinates: null,
      bloodGroup: null,
      address: null,
      divisionId: null,
      districtId: null,
      upazilaId: null,
      divisionName: null,
      districtName: null,
      upazilaName: null,
    };
  }

  const upazilaCoordinates = extractCoordinates(profile.upazila);
  const districtCoordinates = extractCoordinates(profile.district);
  const divisionCoordinates = extractCoordinates(profile.division);
  const coordinates = upazilaCoordinates ?? districtCoordinates ?? divisionCoordinates ?? null;

  return {
    coordinates,
    bloodGroup: profile.bloodGroup,
    address: profile.address ? profile.address.toLowerCase() : null,
    divisionId: profile.divisionId,
    districtId: profile.districtId,
    upazilaId: profile.upazilaId,
    divisionName: profile.division?.name ?? null,
    districtName: profile.district?.name ?? null,
    upazilaName: profile.upazila?.name ?? null,
  };
};

const getRequestCoordinates = (request: BloodRequestWithRelations): Coordinates | null => {
  if (typeof request.latitude === "number" && typeof request.longitude === "number") {
    return { lat: request.latitude, lng: request.longitude };
  }

  return (
    extractCoordinates(request.upazila)
    ?? extractCoordinates(request.district)
    ?? extractCoordinates(request.division)
  );
};

const isCompatibleBloodGroup = (viewerGroup: string | null, requestGroup: string | null) => {
  if (!viewerGroup || !requestGroup) {
    return 0;
  }
  if (viewerGroup === requestGroup) {
    return 60;
  }
  const compatible = BLOOD_COMPATIBILITY[viewerGroup];
  if (compatible?.includes(requestGroup)) {
    return 35;
  }
  return 0;
};

const computeAddressAffinity = (viewer: ViewerContext, request: BloodRequestWithRelations) => {
  const target = request.location?.toLowerCase();
  if (!viewer.address || !target) {
    return 0;
  }

  const tokens = viewer.address
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  if (tokens.length === 0) {
    return 0;
  }

  let matchCount = 0;
  tokens.forEach((token) => {
    if (token && target.includes(token)) {
      matchCount += 1;
    }
  });

  if (matchCount === 0) {
    return 0;
  }

  return 8 + Math.min(matchCount, 4) * 3;
};

const computeRegionalAffinity = (viewer: ViewerContext, request: BloodRequestWithRelations) => {
  if (viewer.upazilaId && request.upazilaId === viewer.upazilaId) {
    return 38;
  }
  if (viewer.districtId && request.districtId === viewer.districtId) {
    return 24;
  }
  if (viewer.divisionId && request.divisionId === viewer.divisionId) {
    return 18;
  }
  return 0;
};

const computePriorityScore = (request: BloodRequestWithRelations, viewer: ViewerContext, now: Date) => {
  let score = 0;

  const requestCoordinates = getRequestCoordinates(request);
  if (viewer.coordinates && requestCoordinates) {
    const distanceKm = computeDistanceKm(viewer.coordinates, requestCoordinates);
    const clamped = Math.min(distanceKm, MAX_DISTANCE_PRIORITY_KM);
    const proximityScore = Math.max(0, (MAX_DISTANCE_PRIORITY_KM - clamped) / MAX_DISTANCE_PRIORITY_KM) * 60;
    score += proximityScore;
    if (distanceKm <= 15) {
      score += 12;
    }
    if (distanceKm <= 5) {
      score += 10;
    }
  } else {
    score += computeAddressAffinity(viewer, request);
  }

  score += computeRegionalAffinity(viewer, request);
  score += isCompatibleBloodGroup(viewer.bloodGroup, request.bloodGroup);
  score += URGENCY_SCORES[request.urgencyStatus] ?? 0;

  const requiredDate = request.requiredDate;
  if (requiredDate) {
    if (requiredDate.getTime() < now.getTime()) {
      const hoursPast = Math.max(0, differenceInHours(now, requiredDate));
      score -= PAST_DATE_PENALTY + Math.min(hoursPast, RECENCY_WINDOW_HOURS) * 0.5;
    } else {
      const hoursUntil = Math.max(0, differenceInHours(requiredDate, now));
      const timeScore = Math.max(0, (UPCOMING_WINDOW_HOURS - Math.min(hoursUntil, UPCOMING_WINDOW_HOURS)) / UPCOMING_WINDOW_HOURS) * 50;
      score += timeScore;
    }
  }

  const createdHoursAgo = Math.max(0, differenceInHours(now, request.createdAt));
  score += Math.max(0, (RECENCY_WINDOW_HOURS - Math.min(createdHoursAgo, RECENCY_WINDOW_HOURS)) / RECENCY_WINDOW_HOURS) * 18;

  const donorsNeeded = Number(request.amountNeeded ?? 0);
  if (Number.isFinite(donorsNeeded) && donorsNeeded > 0) {
    const fulfilledRatio = Math.min(request.donorsAssigned / donorsNeeded, 1);
    score += Math.max(0, (1 - fulfilledRatio)) * 14;
    if (fulfilledRatio >= 1) {
      score -= 60;
    }
  }

  if (request.status === "Pending") {
    score -= 25;
  } else if (request.status !== "Open") {
    score -= NON_OPEN_STATUS_PENALTY;
  }

  if (viewer.divisionName) {
    const target = request.location?.toLowerCase() ?? "";
    if (target.includes(viewer.divisionName.toLowerCase())) {
      score += 6;
    }
  }
  if (viewer.districtName) {
    const target = request.location?.toLowerCase() ?? "";
    if (target.includes(viewer.districtName.toLowerCase())) {
      score += 8;
    }
  }
  if (viewer.upazilaName) {
    const target = request.location?.toLowerCase() ?? "";
    if (target.includes(viewer.upazilaName.toLowerCase())) {
      score += 10;
    }
  }

  return score;
};

type FeedPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

type FeedFilters = {
  page?: string;
  bloodGroup?: string;
  urgency?: string;
};

const toSingleValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const createHref = (current: FeedFilters, overrides: Partial<FeedFilters>) => {
  const merged: FeedFilters = { ...current, ...overrides };

  if (!merged.page || Number(merged.page) <= 1) {
    delete merged.page;
  }

  const params = new URLSearchParams();

  if (merged.bloodGroup) params.set("bloodGroup", merged.bloodGroup);
  if (merged.urgency) params.set("urgency", merged.urgency);
  if (merged.page) params.set("page", merged.page);

  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const rawFilters: FeedFilters = {
    page: toSingleValue(resolvedSearchParams.page),
    bloodGroup: toSingleValue(resolvedSearchParams.bloodGroup),
    urgency: toSingleValue(resolvedSearchParams.urgency),
  };

  const page = Math.max(1, Number(rawFilters.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const userId = Number(sessionUser.id);

  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const activeFilters: FeedFilters = {
    ...rawFilters,
    page: page > 1 ? String(page) : undefined,
  };

  const where: Prisma.BloodRequestWhereInput = {};

  if (activeFilters.bloodGroup) {
    where.bloodGroup = activeFilters.bloodGroup;
  }

  if (activeFilters.urgency) {
    where.urgencyStatus = activeFilters.urgency;
  }

  const viewerProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bloodGroup: true,
      address: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      division: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      },
      district: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      },
      upazila: {
        select: {
          name: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  const viewerContext = getUserContext(viewerProfile);

  const requests = await prisma.bloodRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      ...bloodRequestInclude,
      upvotes: {
        ...bloodRequestInclude.upvotes,
        where: { userId },
      },
      donorResponses: {
        ...bloodRequestInclude.donorResponses,
        where: { donorId: userId },
      },
    },
  });

  const typedRequests = requests as BloodRequestWithRelations[];
  const now = new Date();

  const prioritizedRequests = typedRequests
    .map((request) => ({
      request,
      score: computePriorityScore(request, viewerContext, now),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aRequired = a.request.requiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const bRequired = b.request.requiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aRequired !== bRequired) {
        return aRequired - bRequired;
      }

      const aUpdated = a.request.updatedAt.getTime();
      const bUpdated = b.request.updatedAt.getTime();
      if (aUpdated !== bUpdated) {
        return bUpdated - aUpdated;
      }

      return b.request.createdAt.getTime() - a.request.createdAt.getTime();
    })
    .map((entry) => entry.request);

  const totalMatchingRequests = prioritizedRequests.length;
  const paginatedRequests = prioritizedRequests.slice(skip, skip + PAGE_SIZE);

  const feedItems: BloodRequestFeedItem[] = paginatedRequests.map((request) => ({
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
    latitude: request.latitude,
    longitude: request.longitude,
    divisionName: request.division?.name ?? null,
    districtName: request.district?.name ?? null,
    upazilaName: request.upazila?.name ?? null,
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
    hasUpvoted: request.upvotes.length > 0,
    hasResponded: request.donorResponses.length > 0,
    isOwner: request.user.id === userId,
  }));

  const hasPrev = page > 1;
  const hasMore = skip + PAGE_SIZE < totalMatchingRequests;

  const activeBadges = [
    activeFilters.bloodGroup ? { key: "bloodGroup", label: `Blood group: ${activeFilters.bloodGroup}` } : null,
    activeFilters.urgency ? { key: "urgency", label: `Urgency: ${activeFilters.urgency}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const lastUpdatedRelative = prioritizedRequests.length
    ? formatDistanceToNow(prioritizedRequests[0].updatedAt, { addSuffix: true })
    : "just now";

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Community News Feed</h1>
          <p className="text-sm text-secondary">
            Explore active blood requests, fine-tune filters, and rally donors for the cases that need help most.
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">Create blood request</Link>
        </Button>
      </header>

      <section className="rounded-2xl border border-soft bg-surface-card p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-4 text-secondary">
          <div className="min-w-[200px]">
            <p className="text-xs font-medium uppercase text-muted">Blood group</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((group) => (
                <Button
                  key={group}
                  asChild
                  size="sm"
                  variant={activeFilters.bloodGroup === group ? "primary" : "secondary"}
                >
                  <Link href={createHref(activeFilters, { bloodGroup: group, page: undefined })}>{group}</Link>
                </Button>
              ))}
              <Button asChild size="sm" variant="ghost">
                <Link href={createHref(activeFilters, { bloodGroup: undefined, page: undefined })}>Any</Link>
              </Button>
            </div>
          </div>

          <div className="min-w-[200px]">
            <p className="text-xs font-medium uppercase text-muted">Urgency</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map((option) => (
                <Button
                  key={option}
                  asChild
                  size="sm"
                  variant={activeFilters.urgency === option ? "primary" : "secondary"}
                >
                  <Link href={createHref(activeFilters, { urgency: option, page: undefined })}>{option}</Link>
                </Button>
              ))}
              <Button asChild size="sm" variant="ghost">
                <Link href={createHref(activeFilters, { urgency: undefined, page: undefined })}>Any</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-4 text-xs text-secondary">
          {activeBadges.map((badge) => (
            <Badge key={badge.key} variant="secondary">
              {badge.label}
            </Badge>
          ))}
          <Link
            href={createHref(activeFilters, {
              bloodGroup: undefined,
              urgency: undefined,
              page: undefined,
            })}
            className="text-xs font-semibold text-[var(--color-text-accent)] underline-offset-4 hover:text-[var(--color-text-accent-hover)] hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}

      <section className="grid gap-5">
        {feedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft p-10 text-center">
            <h2 className="text-xl font-semibold text-primary">No requests match these filters yet</h2>
            <p className="mt-2 text-sm text-secondary">
              Try broadening your filters or create a new request for your community.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild>
                <Link href="/requests/new">Raise a blood request</Link>
              </Button>
            </div>
          </div>
        ) : (
          feedItems.map((item) => <BloodRequestCard key={item.id} request={item} />)
        )}
      </section>

      {(hasPrev || hasMore) && (
        <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-secondary">
          <div className="flex flex-wrap items-center gap-3">
            {hasPrev ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={createHref(activeFilters, { page: String(page - 1) })}>Newer updates</Link>
              </Button>
            ) : (
              <span>You&apos;re viewing the latest updates</span>
            )}

            {hasMore ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={createHref(activeFilters, { page: String(page + 1) })}>Older updates</Link>
              </Button>
            ) : (
              <span>No older requests</span>
            )}
          </div>
          <div className="text-xs text-muted">Updated {lastUpdatedRelative}</div>
        </footer>
      )}
    </div>
  );
}
