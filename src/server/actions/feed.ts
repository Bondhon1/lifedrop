"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { differenceInHours } from "date-fns";
import type { SessionUser } from "@/lib/auth";

const PAGE_SIZE = 6;

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
  _count: {
    select: {
      comments: true,
    },
  },
} satisfies Prisma.BloodRequestInclude;

type BloodRequestWithRelations = Prisma.BloodRequestGetPayload<{
  include: typeof bloodRequestInclude;
}>;

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

// Priority scoring constants
const URGENCY_SCORES: Record<string, number> = {
  Critical: 100,
  Urgent: 60,
  Normal: 10,
};

const BLOOD_GROUP_COMPATIBILITY: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

const MAX_DISTANCE_PRIORITY_KM = 100;
const RECENCY_WINDOW_HOURS = 72;
const UPCOMING_WINDOW_HOURS = 72;
const PAST_DATE_PENALTY = 40;
const NON_OPEN_STATUS_PENALTY = 100;

const isCompatibleBloodGroup = (donorBloodGroup: string | null, requestedBloodGroup: string): number => {
  if (!donorBloodGroup) return 0;
  const compatible = BLOOD_GROUP_COMPATIBILITY[donorBloodGroup] ?? [];
  return compatible.includes(requestedBloodGroup) ? 80 : 0;
};

const extractCoordinates = (
  location: { latitude: number | null; longitude: number | null } | null,
): Coordinates | null => {
  if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
    return null;
  }
  return { lat: location.latitude, lng: location.longitude };
};

const computeDistanceKm = (a: Coordinates, b: Coordinates): number => {
  const R = 6371;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

const computeAddressAffinity = (viewer: ViewerContext, request: BloodRequestWithRelations): number => {
  if (!viewer.address || !request.location) return 0;
  const viewerAddr = viewer.address.toLowerCase();
  const requestAddr = request.location.toLowerCase();
  const commonWords = viewerAddr
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => requestAddr.includes(word));
  return commonWords.length > 0 ? 12 : 0;
};

const computeRegionalAffinity = (viewer: ViewerContext, request: BloodRequestWithRelations): number => {
  if (viewer.upazilaId && request.upazilaId === viewer.upazilaId) {
    return 55;
  }
  if (viewer.districtId && request.districtId === viewer.districtId) {
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
    extractCoordinates(request.upazila) ?? extractCoordinates(request.district) ?? extractCoordinates(request.division) ?? null
  );
};

const computePriorityScore = (request: BloodRequestWithRelations, viewer: ViewerContext, now: Date) => {
  let score = 0;

  // Distance-based scoring
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

  // Regional affinity
  score += computeRegionalAffinity(viewer, request);

  // Blood group compatibility
  score += isCompatibleBloodGroup(viewer.bloodGroup, request.bloodGroup);

  // Urgency status
  score += URGENCY_SCORES[request.urgencyStatus] ?? 0;

  // Required date scoring
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

  // Recency bonus
  const createdHoursAgo = Math.max(0, differenceInHours(now, request.createdAt));
  score += Math.max(0, (RECENCY_WINDOW_HOURS - Math.min(createdHoursAgo, RECENCY_WINDOW_HOURS)) / RECENCY_WINDOW_HOURS) * 18;

  // Fulfillment status
  const donorsNeeded = Number(request.amountNeeded ?? 0);
  if (Number.isFinite(donorsNeeded) && donorsNeeded > 0) {
    const fulfilledRatio = Math.min(request.donorsAssigned / donorsNeeded, 1);
    score += Math.max(0, 1 - fulfilledRatio) * 14;
    if (fulfilledRatio >= 1) {
      score -= 60;
    }
  }

  // Status penalties
  if (request.status === "Pending") {
    score -= 25;
  } else if (request.status !== "Open") {
    score -= NON_OPEN_STATUS_PENALTY;
  }

  // Location name matching
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

export type FeedFilters = {
  bloodGroup?: string;
  urgency?: string;
};

export type FeedItem = {
  id: number;
  patientName: string;
  gender: string;
  requiredDate: string;
  bloodGroup: string;
  amountNeeded: number;
  hospitalName: string;
  urgencyStatus: string;
  smokerPreference: string;
  reason: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  divisionName?: string | null;
  districtName?: string | null;
  upazilaName?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  commentCount: number;
  donorsAssigned: number;
  owner: {
    id: number;
    username: string;
    name?: string | null;
    bloodGroup?: string | null;
  };
  hasUpvoted: boolean;
  hasResponded: boolean;
  isOwner: boolean;
  viewerIsApprovedDonor: boolean;
  viewerCanRespond: boolean;
  viewerBlockedReason?: string | null;
  viewerResponseStatus?: "Pending" | "Accepted" | "Declined" | null;
};

export async function getFeedItems(filters: FeedFilters, cursor?: number) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  
  if (!user?.id) {
    return { items: [], hasMore: false, nextCursor: null, newItemsCount: 0 };
  }

  const userId = Number(user.id);

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bloodGroup: true,
      address: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      donorApplication: {
        select: {
          status: true,
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
    },
  });

  const viewer = getUserContext(profile);
  const now = new Date();
  const isApprovedDonor = profile?.donorApplication?.status === "Approved";

  // Build where clause
  const whereClause: Prisma.BloodRequestWhereInput = {
    ...(filters.bloodGroup && { bloodGroup: filters.bloodGroup }),
    ...(filters.urgency && { urgencyStatus: filters.urgency }),
  };

  // Fetch requests
  const requests = await prisma.bloodRequest.findMany({
    where: whereClause,
    include: {
      ...bloodRequestInclude,
      upvotes: {
        where: { userId },
        select: { id: true },
      },
      donorResponses: {
        where: { donorId: userId },
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = requests.length > PAGE_SIZE;
  const itemsToProcess = hasMore ? requests.slice(0, PAGE_SIZE) : requests;

  // Compute scores and sort
  const scored = itemsToProcess.map((req) => ({
    request: req,
    score: computePriorityScore(req, viewer, now),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Check for new items (if cursor provided)
  let newItemsCount = 0;
  if (cursor) {
    const newItems = await prisma.bloodRequest.findMany({
      where: {
        ...whereClause,
        id: { gt: cursor },
      },
      select: { id: true },
    });
    newItemsCount = newItems.length;
  }

  // Transform to feed items
  const items: FeedItem[] = scored.map(({ request }) => ({
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
    latitude: request.latitude ?? null,
    longitude: request.longitude ?? null,
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
    isOwner: request.userId === userId,
    viewerIsApprovedDonor: isApprovedDonor,
    viewerCanRespond: isApprovedDonor && request.userId !== userId && request.donorResponses.length === 0,
    viewerBlockedReason: null,
    viewerResponseStatus: (request.donorResponses[0]?.status as "Pending" | "Accepted" | "Declined") ?? null,
  }));

  const nextCursor = hasMore ? itemsToProcess[itemsToProcess.length - 1]?.id : null;

  return {
    items,
    hasMore,
    nextCursor,
    newItemsCount,
  };
}

export async function getNewFeedItems(filters: FeedFilters, sinceId: number) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  
  if (!user?.id) {
    return { items: [] };
  }

  const userId = Number(user.id);

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bloodGroup: true,
      address: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      donorApplication: {
        select: {
          status: true,
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
    },
  });

  const viewer = getUserContext(profile);
  const now = new Date();
  const isApprovedDonor = profile?.donorApplication?.status === "Approved";

  // Build where clause for new items
  const whereClause: Prisma.BloodRequestWhereInput = {
    id: { gt: sinceId },
    ...(filters.bloodGroup && { bloodGroup: filters.bloodGroup }),
    ...(filters.urgency && { urgencyStatus: filters.urgency }),
  };

  // Fetch new requests
  const requests = await prisma.bloodRequest.findMany({
    where: whereClause,
    include: {
      ...bloodRequestInclude,
      upvotes: {
        where: { userId },
        select: { id: true },
      },
      donorResponses: {
        where: { donorId: userId },
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute scores and sort
  const scored = requests.map((req) => ({
    request: req,
    score: computePriorityScore(req, viewer, now),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Transform to feed items
  const items: FeedItem[] = scored.map(({ request }) => ({
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
    latitude: request.latitude ?? null,
    longitude: request.longitude ?? null,
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
    isOwner: request.userId === userId,
    viewerIsApprovedDonor: isApprovedDonor,
    viewerCanRespond: isApprovedDonor && request.userId !== userId && request.donorResponses.length === 0,
    viewerBlockedReason: null,
    viewerResponseStatus: (request.donorResponses[0]?.status as "Pending" | "Accepted" | "Declined") ?? null,
  }));

  return { items };
}
