"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { respondToBloodRequest, toggleBloodRequestUpvote } from "@/server/actions/blood-request";
import { BloodRequestOptions } from "./blood-request-options";
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
  viewerIsApprovedDonor?: boolean;
  viewerCanRespond?: boolean;
  viewerBlockedReason?: string | null;
  viewerResponseStatus?: "Pending" | "Accepted" | "Declined" | null;
};

type BadgeVariant = "default" | "secondary" | "success" | "warning";

type BadgeStyle = { variant: BadgeVariant; className?: string };

const urgencyStyles: Record<BloodRequestFeedItem["urgencyStatus"], BadgeStyle> = {
  Normal: { variant: "secondary" },
  Urgent: { variant: "warning" },
  Critical: {
    variant: "default",
    className: "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-text-danger)]",
  },
};

const statusStyles: Record<BloodRequestFeedItem["status"], BadgeStyle> = {
  Open: {
    variant: "secondary",
    className: "border-[var(--color-border-secondary)] bg-surface-secondary-soft text-[var(--color-text-accent-strong)]",
  },
  Pending: { variant: "warning" },
  Fulfilled: { variant: "success" },
  Closed: {
    variant: "default",
    className: "border-soft bg-surface-card-muted text-muted",
  },
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
  const [responseStatus, setResponseStatus] = useState<"Pending" | "Accepted" | "Declined" | null>(request.viewerResponseStatus ?? null);

  const viewerIsApprovedDonor = request.viewerIsApprovedDonor ?? false;
  const viewerCanRespond = request.viewerCanRespond ?? false;
  const viewerBlockedReason = request.viewerBlockedReason ?? null;

  const requestIsFulfilled = donorsAssigned >= request.amountNeeded || request.status === "Fulfilled";

  const urgencyStyle = useMemo(() => urgencyStyles[request.urgencyStatus], [request.urgencyStatus]);
  const statusStyle = useMemo(() => statusStyles[request.status], [request.status]);

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
      setResponseStatus("Pending");
      toast.success("Thank you! We’ve recorded your availability.");
    });
  };

  const renderRespondAction = () => {
    if (request.isOwner) {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="min-w-[10rem]"
        >
          You created this
        </Button>
      );
    }

    if (!viewerIsApprovedDonor) {
      return (
        <Button
          variant="primary"
          size="sm"
          asChild
          className="min-w-[10rem]"
        >
          <Link href="/donors">Become a donor</Link>
        </Button>
      );
    }

    let label = "I can donate";
    let disabled = requestIsFulfilled || isPending;

    if (responseStatus === "Accepted") {
      label = "Accepted to donate";
      disabled = true;
    } else if (responseStatus === "Pending") {
      label = "Awaiting approval";
      disabled = true;
    } else if (responseStatus === "Declined") {
      label = "Offer declined";
      disabled = true;
    } else if (hasResponded) {
      label = "You’ve responded";
      disabled = true;
    } else if (!viewerCanRespond) {
      label = viewerBlockedReason ?? "Not eligible right now";
      disabled = true;
    }

    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          if (disabled) return;
          handleRespond();
        }}
        disabled={disabled}
        className="min-w-[10rem]"
        title={!viewerCanRespond && viewerBlockedReason ? viewerBlockedReason : undefined}
      >
        {label}
      </Button>
    );
  };

  return (
    <Card className="overflow-hidden border border-soft bg-surface-card shadow-soft transition hover:-translate-y-0.5">
      <CardHeader className="flex flex-col gap-4 border-b border-soft bg-surface-primary-soft pb-4 text-primary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold text-primary">{request.patientName}</CardTitle>
            <CardDescription className="text-sm text-secondary">
              Requested by{" "}
              <Link
                href={`/members/${request.owner.username}`}
                className="font-semibold text-[var(--color-text-accent)] underline-offset-4 hover:text-[var(--color-text-accent-hover)] hover:underline"
              >
                {request.owner.name ?? request.owner.username}
              </Link>{" "}
              · {formatRelativeTime(request.createdAt)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={urgencyStyle.variant} className={urgencyStyle.className}>
              {request.urgencyStatus}
            </Badge>
            <Badge variant={statusStyle.variant} className={statusStyle.className}>
              {request.status}
            </Badge>
            <BloodRequestOptions
              requestId={request.id}
              isOwner={request.isOwner}
              status={request.status}
              amountNeeded={request.amountNeeded}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-primary)] bg-surface-primary-soft px-3 py-1">
            <Droplet className="h-4 w-4 text-[var(--color-text-danger)]" />
            {request.bloodGroup}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-primary)] bg-surface-primary-soft px-3 py-1">
            <Heart className="h-4 w-4 text-[var(--color-text-danger)]" />
            {donorsAssigned}/{request.amountNeeded} donors pledged
          </span>
          <Link
            href={`/requests/${request.id}#comments`}
            className="inline-flex items-center gap-1 rounded-full border border-transparent bg-surface-primary-soft px-3 py-1 text-secondary transition hover:border-[var(--color-border-primary)] hover:text-primary"
          >
            <MessageCircle className="h-4 w-4 text-[var(--color-text-accent)]" /> {request.commentCount} comments
          </Link>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 p-6">
        <div className="grid gap-2 text-sm text-secondary">
          <p>
            <strong className="text-primary">Hospital:</strong> {request.hospitalName}
          </p>
          <p>
            <strong className="text-primary">Location:</strong> {locationLabel}
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
          </p>
          {coordinateLabel && <p className="text-xs text-muted">GPS: {coordinateLabel}</p>}
          <p>
            <strong className="text-primary">Needed by:</strong> {new Date(request.requiredDate).toLocaleDateString()}
          </p>
          <p>
            <strong className="text-primary">Smoker preference:</strong> {request.smokerPreference}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-primary">{reasonToDisplay}</p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={hasUpvoted ? "secondary" : "primary"}
            size="sm"
            onClick={handleToggleUpvote}
            disabled={isPending}
            className="min-w-[8rem] gap-2"
          >
            <Heart className="h-4 w-4" /> {upvoteCount} supports
          </Button>

          {renderRespondAction()}

          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-[var(--color-text-accent)]">
            <Link href={`/requests/${request.id}#comments`}>
              <MessageCircle className="mr-2 h-4 w-4" /> Discuss
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-[var(--color-text-accent)]">
            <Link href={`/requests/${request.id}`}>
              <Share2 className="mr-2 h-4 w-4" /> View details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
