import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { addDays, formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BloodRequestCard, type BloodRequestFeedItem } from "@/components/feed/blood-request-card";

const PAGE_SIZE = 6;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const URGENCY_OPTIONS = ["Normal", "Urgent", "Critical"] as const;
const STATUS_OPTIONS = ["Open", "Pending", "Fulfilled", "Closed"] as const;

type FeedPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

type FeedFilters = {
  page?: string;
  bloodGroup?: string;
  urgency?: string;
  status?: string;
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
  if (merged.status) params.set("status", merged.status);
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
    status: toSingleValue(resolvedSearchParams.status),
  };

  const page = Math.max(1, Number(rawFilters.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const userId = Number(sessionUser.id);

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

  if (activeFilters.status) {
    where.status = activeFilters.status;
  }

  const locationAwareWhere: Prisma.BloodRequestWhereInput = {
    ...where,
    latitude: { not: null },
    longitude: { not: null },
  };

  const criticalWhere: Prisma.BloodRequestWhereInput = {
    ...where,
  };

  if (!activeFilters.urgency) {
    criticalWhere.urgencyStatus = "Critical";
  }

  const closingSoonWhere: Prisma.BloodRequestWhereInput = {
    ...where,
    requiredDate: { lte: addDays(new Date(), 2) },
  };

  if (!activeFilters.status) {
    closingSoonWhere.status = { in: ["Open", "Pending"] };
  }

  const [requests, totalMatchingRequests, withLocationCount, criticalCount, closingSoonCount] = await Promise.all([
    prisma.bloodRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
          },
        },
        division: {
          select: { name: true },
        },
        district: {
          select: { name: true },
        },
        upazila: {
          select: { name: true },
        },
        upvotes: {
          where: { userId },
          select: { id: true },
        },
        donorResponses: {
          where: { donorId: userId },
          select: { id: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.bloodRequest.count({ where }),
    prisma.bloodRequest.count({ where: locationAwareWhere }),
    prisma.bloodRequest.count({ where: criticalWhere }),
    prisma.bloodRequest.count({ where: closingSoonWhere }),
  ]);

  const feedItems: BloodRequestFeedItem[] = requests.map((request) => ({
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
  const hasMore = page * PAGE_SIZE < totalMatchingRequests;

  const activeBadges = [
    activeFilters.bloodGroup ? { key: "bloodGroup", label: `Blood group: ${activeFilters.bloodGroup}` } : null,
    activeFilters.urgency ? { key: "urgency", label: `Urgency: ${activeFilters.urgency}` } : null,
    activeFilters.status ? { key: "status", label: `Status: ${activeFilters.status}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const stats = [
    { label: "Matching requests", value: totalMatchingRequests },
    { label: "Location enabled", value: withLocationCount },
    { label: "Critical priority", value: criticalCount },
    { label: "Needed within 48h", value: closingSoonCount },
  ];

  const lastUpdatedRelative = requests.length
    ? formatDistanceToNow(requests[0].updatedAt, { addSuffix: true })
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-soft bg-surface-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Filters</h2>
          <div className="mt-4 space-y-4 text-secondary">
            <div>
              <p className="text-xs font-medium uppercase text-muted">Blood group</p>
              <div className="mt-2 flex flex-wrap gap-2">
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

            <div>
              <p className="text-xs font-medium uppercase text-muted">Urgency</p>
              <div className="mt-2 flex flex-wrap gap-2">
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

            <div>
              <p className="text-xs font-medium uppercase text-muted">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    asChild
                    size="sm"
                    variant={activeFilters.status === option ? "primary" : "secondary"}
                  >
                    <Link href={createHref(activeFilters, { status: option, page: undefined })}>{option}</Link>
                  </Button>
                ))}
                <Button asChild size="sm" variant="ghost">
                  <Link href={createHref(activeFilters, { status: undefined, page: undefined })}>Any</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-soft bg-surface-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">At a glance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-4">
                <p className="text-xs uppercase tracking-wide text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{stat.value}</p>
              </div>
            ))}
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
              status: undefined,
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
