import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { FeedContent } from "@/components/feed/feed-content";
import { getFeedItems, type FeedFilters } from "@/server/actions/feed";

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

type FeedPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

const toSingleValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
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

  return <FeedContent initialItems={initialItems} initialCursor={nextCursor} activeFilters={activeFilters} activeBadges={activeBadges} />;
}