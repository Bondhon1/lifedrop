"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfiniteFeed } from "@/components/feed/infinite-feed";
import { ActiveDonors, ActiveDonorsModal } from "@/components/feed/active-donors";
import { type FeedFilters, type FeedItem } from "@/server/actions/feed";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const URGENCY_OPTIONS = ["Normal", "Urgent", "Critical"] as const;

type ActiveBadge = {
  key: string;
  label: string;
};

const createHref = (current: FeedFilters, overrides: Partial<FeedFilters> = {}): string => {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (merged.bloodGroup) params.set("bloodGroup", merged.bloodGroup);
  if (merged.urgency) params.set("urgency", merged.urgency);

  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
};

type FeedContentProps = {
  initialItems: FeedItem[];
  initialCursor: number | null;
  activeFilters: FeedFilters;
  activeBadges: ActiveBadge[];
};

export function FeedContent({ initialItems, initialCursor, activeFilters, activeBadges }: FeedContentProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <section className="grid gap-4 rounded-3xl border border-soft bg-surface-card p-6 shadow-soft">
            <div className="grid gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-primary">Blood Donation Requests</h1>
              <div className="lg:hidden flex items-center gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-2 flex-1"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <ActiveDonorsModal />
              </div>
            </div>

            {/* Mobile Filters - Expandable */}
            <div className="lg:hidden">
              {showMobileFilters && (
                <div className="space-y-4 pt-4 border-t border-soft">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">Blood Group</label>
                    <div className="flex flex-wrap gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <Link key={bg} href={createHref(activeFilters, { bloodGroup: bg })}>
                          <Badge
                            variant={activeFilters.bloodGroup === bg ? "default" : "outline"}
                            className="cursor-pointer px-2 py-1 text-xs"
                          >
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
                          <Badge variant={activeFilters.urgency === urg ? "default" : "outline"} className="cursor-pointer px-2 py-1 text-xs">
                            {urg}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:block">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Blood Group</label>
                  <div className="flex flex-wrap gap-1">
                    {BLOOD_GROUPS.map((bg) => (
                      <Link key={bg} href={createHref(activeFilters, { bloodGroup: bg })}>
                        <Badge
                          variant={activeFilters.bloodGroup === bg ? "default" : "outline"}
                          className="cursor-pointer px-2 py-1 text-xs"
                        >
                          {bg}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Urgency</label>
                  <div className="flex flex-wrap gap-1">
                    {URGENCY_OPTIONS.map((urg) => (
                      <Link key={urg} href={createHref(activeFilters, { urgency: urg })}>
                        <Badge variant={activeFilters.urgency === urg ? "default" : "outline"} className="cursor-pointer px-2 py-1 text-xs">
                          {urg}
                        </Badge>
                      </Link>
                    ))}
                  </div>
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
            <InfiniteFeed initialItems={initialItems} initialCursor={initialCursor} filters={activeFilters} />
          </section>

          <ScrollToTop />
        </div>

        {/* Active Donors Sidebar - Desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <ActiveDonors />
          </div>
        </div>
      </div>
    </div>
  );
}