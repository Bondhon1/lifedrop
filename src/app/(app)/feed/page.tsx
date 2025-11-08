import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfiniteFeed } from "@/components/feed/infinite-feed";
import { getFeedItems, type FeedFilters } from "@/server/actions/feed";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export const metadata: Metadata = {
  title: "Blood Donation Requests | Find Donors Near You",
  description:
    "Browse urgent and active blood donation requests. Find patients who need your blood type and become a life-saving donor today. Filter by blood group, location, and urgency.",
  keywords: [
    "blood donation requests",
    "urgent blood needed",
    "find blood donor",
    "blood donation feed",
    "emergency blood",
    "donate blood near me",
  ],
  openGraph: {
    title: "Blood Donation Requests | Lifedrop",
    description: "Browse urgent blood donation requests and connect with patients in need.",
    type: "website",
  },
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const URGENCY_OPTIONS = ["Normal", "Urgent", "Critical"] as const;

type FeedPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

const toSingleValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const createHref = (current: FeedFilters, overrides: Partial<FeedFilters> = {}): string => {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (merged.bloodGroup) params.set("bloodGroup", merged.bloodGroup);
  if (merged.urgency) params.set("urgency", merged.urgency);

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

  const rawFilters = {
    bloodGroup: toSingleValue(resolvedSearchParams.bloodGroup),
    urgency: toSingleValue(resolvedSearchParams.urgency),
  };

  const activeFilters: FeedFilters = {
    ...(rawFilters.bloodGroup && { bloodGroup: rawFilters.bloodGroup }),
    ...(rawFilters.urgency && { urgency: rawFilters.urgency }),
  };

  // Fetch initial feed items
  const { items: initialItems, nextCursor } = await getFeedItems(activeFilters);

  const activeBadges = [];
  if (activeFilters.bloodGroup) {
    activeBadges.push({ key: "bloodGroup", label: `Blood: ${activeFilters.bloodGroup}` });
  }
  if (activeFilters.urgency) {
    activeBadges.push({ key: "urgency", label: `Status: ${activeFilters.urgency}` });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <section className="grid gap-4 rounded-3xl border border-soft bg-surface-card p-6 shadow-soft">
        <div className="grid gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Blood Donation Requests</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Blood Group</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <Link key={bg} href={createHref(activeFilters, { bloodGroup: bg })}>
                  <Badge variant={activeFilters.bloodGroup === bg ? "default" : "outline"} className="cursor-pointer">
                    {bg}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">Urgency</label>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map((urg) => (
                <Link key={urg} href={createHref(activeFilters, { urgency: urg })}>
                  <Badge variant={activeFilters.urgency === urg ? "default" : "outline"} className="cursor-pointer">
                    {urg}
                  </Badge>
                </Link>
              ))}
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
            })}
            className="text-xs font-semibold text-[var(--color-text-accent)] underline-offset-4 hover:text-[var(--color-text-accent-hover)] hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}

      <section className="grid gap-5">
        <InfiniteFeed initialItems={initialItems} initialCursor={nextCursor} filters={activeFilters} />
      </section>

      <ScrollToTop />
    </div>
  );
}
