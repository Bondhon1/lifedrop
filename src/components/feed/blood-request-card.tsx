"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { respondToBloodRequest, toggleBloodRequestUpvote } from "@/server/actions/blood-request";
import { cn } from "@/lib/utils";
import { Droplet, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";

export type BloodRequestFeedItem = {
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
  updatedAt?: string;
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
};

const urgencyClassNames: Record<string, string> = {
  Normal: "bg-emerald-500/15 text-emerald-200",
  Urgent: "bg-amber-500/20 text-amber-100",
  Critical: "bg-rose-600/20 text-rose-100",
};

const statusBadgeClasses: Record<string, string> = {
  Open: "bg-sky-500/20 text-sky-100",
  Pending: "bg-amber-500/20 text-amber-100",
  Fulfilled: "bg-emerald-500/20 text-emerald-100",
  Closed: "bg-slate-500/20 text-slate-100",
};

const formatRelativeTime = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch (error) {
    console.error("formatRelativeTime:error", error);
    return "Just now";
  }
};

const truncate = (value: string, limit: number) => {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
};

interface BloodRequestCardProps {
  request: BloodRequestFeedItem;
  showFullReason?: boolean;
}

export function BloodRequestCard({ request, showFullReason = false }: BloodRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [upvoteCount, setUpvoteCount] = useState(request.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(request.hasUpvoted);
  const [donorsAssigned, setDonorsAssigned] = useState(request.donorsAssigned);
  const [hasResponded, setHasResponded] = useState(request.hasResponded);

  const requestIsFulfilled = donorsAssigned >= request.amountNeeded || request.status === "Fulfilled";

  const urgencyBadgeClass = useMemo(() => urgencyClassNames[request.urgencyStatus] ?? urgencyClassNames.Normal, [request.urgencyStatus]);
  const statusBadgeClass = useMemo(() => statusBadgeClasses[request.status] ?? statusBadgeClasses.Open, [request.status]);

  const reasonToDisplay = showFullReason ? request.reason : truncate(request.reason, 260);

  const hasCoordinates = typeof request.latitude === "number" && typeof request.longitude === "number";
  const coordinateLabel = useMemo(() => {
    if (!hasCoordinates) {
      return null;
    }

    return `${(request.latitude as number).toFixed(3)}, ${(request.longitude as number).toFixed(3)}`;
  }, [hasCoordinates, request.latitude, request.longitude]);

  const mapLink = useMemo(() => {
    if (!hasCoordinates) {
      return null;
    }
    return `https://www.google.com/maps?q=${request.latitude},${request.longitude}`;
  }, [hasCoordinates, request.latitude, request.longitude]);

  const locationLabel = useMemo(() => {
    const trimmed = (request.location ?? "").trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    return coordinateLabel ?? "Location unavailable";
  }, [coordinateLabel, request.location]);

  const handleToggleUpvote = () => {
    startTransition(async () => {
      const result = await toggleBloodRequestUpvote(request.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setUpvoteCount(result.data.upvotes);
      setHasUpvoted(result.data.upvoted);
    });
  };

  const handleRespond = () => {
    startTransition(async () => {
      const result = await respondToBloodRequest(request.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setDonorsAssigned(result.data.donorsAssigned);
      setHasResponded(true);
      toast.success("Thank you! We’ve recorded your availability.");
    });
  };

  const disableRespondButton = request.isOwner || requestIsFulfilled || hasResponded || isPending;

  return (
    <Card className="overflow-hidden border border-rose-500/20 bg-rose-950/70 shadow-2xl shadow-rose-900/40">
      <CardHeader className="flex flex-col gap-4 border-b border-rose-500/15 bg-rose-500/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-white">{request.patientName}</CardTitle>
            <CardDescription className="text-rose-100/80">
              Requested by{" "}
              <Link
                href={`/members/${request.owner.username}`}
                className="font-semibold text-rose-50/90 underline-offset-2 hover:text-white hover:underline"
              >
                {request.owner.name ?? request.owner.username}
              </Link>{" "}
              · {formatRelativeTime(request.createdAt)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-xs font-semibold", urgencyBadgeClass)}>{request.urgencyStatus}</Badge>
            <Badge className={cn("text-xs font-semibold", statusBadgeClass)}>{request.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-rose-50/90">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1">
            <Droplet className="h-4 w-4 text-rose-300" />
            {request.bloodGroup}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1">
            <Heart className="h-4 w-4 text-rose-300" />
            {donorsAssigned}/{request.amountNeeded} donors pledged
          </span>
          <Link
            href={`/requests/${request.id}#comments`}
            className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-rose-50/90 transition hover:bg-rose-500/25 hover:text-white"
          >
            <MessageCircle className="h-4 w-4 text-rose-300" /> {request.commentCount} comments
          </Link>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 p-6">
        <div className="grid gap-2 text-sm text-rose-50/80">
          <p>
            <strong className="text-white">Hospital:</strong> {request.hospitalName}
          </p>
          <p>
            <strong className="text-white">Location:</strong> {locationLabel}
            {mapLink ? (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-xs text-rose-200 underline-offset-2 hover:text-white hover:underline"
              >
                <MapPin className="h-3 w-3" /> View map
              </a>
            ) : null}
          </p>
          {coordinateLabel && <p className="text-xs text-rose-100/60">GPS: {coordinateLabel}</p>}
          <p>
            <strong className="text-white">Needed by:</strong> {new Date(request.requiredDate).toLocaleDateString()}
          </p>
          <p>
            <strong className="text-white">Smoker preference:</strong> {request.smokerPreference}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-rose-50/95">{reasonToDisplay}</p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={hasUpvoted ? "secondary" : "primary"}
            size="sm"
            onClick={handleToggleUpvote}
            disabled={isPending}
            className={cn("min-w-[8rem]", hasUpvoted ? "border border-rose-400" : "")}
          >
            <Heart className="h-4 w-4" /> {upvoteCount} supports
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRespond}
            disabled={disableRespondButton}
            className="min-w-[10rem] border border-rose-400/60 text-rose-50"
          >
            {request.isOwner ? "You created this" : requestIsFulfilled ? "Request fulfilled" : hasResponded ? "You’ve responded" : "I can donate"}
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-rose-100/80 hover:text-white">
            <Link href={`/requests/${request.id}#comments`}>
              <MessageCircle className="mr-2 h-4 w-4" /> Discuss
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-rose-100/80 hover:text-white">
            <Link href={`/requests/${request.id}`}>
              <Share2 className="mr-2 h-4 w-4" /> View details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
