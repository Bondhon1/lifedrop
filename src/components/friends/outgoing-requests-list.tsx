"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { cancelFriendRequest } from "@/server/actions/friend";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type OutgoingFriendRequest = {
  id: number;
  createdAt: string;
  receiver: {
    id: number;
    username: string;
    name: string | null;
    bloodGroup: string | null;
    district?: string | null;
    division?: string | null;
    profilePicture: string | null;
  };
};

type OutgoingRequestsListProps = {
  requests: OutgoingFriendRequest[];
};

const friendlyDate = (value: string) => {
  try {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Recently";
  }
};

const resolveAvatar = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

export function OutgoingRequestsList({ requests }: OutgoingRequestsListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = (requestId: number) => {
    setError(null);
    setPendingId(requestId);

    startTransition(async () => {
      const result = await cancelFriendRequest(requestId);
      if (!result.ok) {
        setError(result.message);
        setPendingId(null);
        return;
      }

      setPendingId(null);
      router.refresh();
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-rose-500/25 bg-rose-500/10 p-8 text-center text-sm text-rose-100/80">
        You have not sent any pending requests.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
      {requests.map((request) => {
        const { receiver } = request;
        const avatar = resolveAvatar(receiver.profilePicture);
        const displayName = receiver.name?.trim() && receiver.name.length > 0 ? receiver.name : receiver.username;
        const initials =
          displayName
            .split(/\s+/)
            .filter(Boolean)
            .map((segment) => segment[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || displayName.slice(0, 2).toUpperCase();

        return (
          <article
            key={request.id}
            className="flex flex-col gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/20 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <Avatar
                src={avatar ?? undefined}
                alt={displayName}
                size="lg"
                className="border border-rose-500/40 bg-rose-900/60"
                fallbackIcon={<span className="text-sm font-semibold text-rose-100">{initials}</span>}
              />
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold text-white">{displayName}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-rose-100/80">
                  {receiver.bloodGroup ? <span>Blood group {receiver.bloodGroup}</span> : null}
                  <span className="text-rose-100/60">Sent {friendlyDate(request.createdAt)}</span>
                </div>
                {(receiver.district || receiver.division) && (
                  <p className="mt-1 truncate text-sm text-rose-100/70">
                    {[receiver.district, receiver.division].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending && pendingId === request.id}
                onClick={() => handleCancel(request.id)}
                className="w-full sm:w-auto"
              >
                Cancel request
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
