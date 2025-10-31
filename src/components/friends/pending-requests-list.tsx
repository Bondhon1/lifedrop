"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { respondToFriendRequest } from "@/server/actions/friend";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingFriendRequest = {
  id: number;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    name: string | null;
    bloodGroup: string | null;
    district?: string | null;
    division?: string | null;
    profilePicture: string | null;
  };
};

type PendingRequestsListProps = {
  requests: PendingFriendRequest[];
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

export function PendingRequestsList({ requests }: PendingRequestsListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (requestId: number, action: "accept" | "decline") => {
    setError(null);
    setPendingId(requestId);

    startTransition(async () => {
      const result = await respondToFriendRequest(requestId, action);
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
      <div className="rounded-3xl border border-dashed border-rose-500/25 bg-rose-500/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-white">No pending friend requests</h3>
        <p className="mt-2 text-sm text-rose-100/80">
          When someone sends you a request to connect it will show up right here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-100">{error}</p>}
      {requests.map((request) => {
        const { sender } = request;
        const avatar = resolveAvatar(sender.profilePicture);
        const displayName = sender.name?.trim() && sender.name.length > 0 ? sender.name : sender.username;
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
            className="flex flex-col gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/30 p-4 shadow-lg shadow-rose-950/30 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <Avatar
                src={avatar ?? undefined}
                alt={sender.name ?? sender.username}
                size="lg"
                className="border border-rose-500/40 bg-rose-900/60"
                fallbackIcon={<span className="text-sm font-semibold text-rose-100">{initials}</span>}
              />
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold text-white">{sender.name ?? sender.username}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-rose-100/80">
                  {sender.bloodGroup ? <span className="font-medium">Blood group {sender.bloodGroup}</span> : null}
                  <span className="text-rose-100/60">Requested {friendlyDate(request.createdAt)}</span>
                </div>
                {(sender.district || sender.division) && (
                  <p className="mt-1 truncate text-sm text-rose-100/70">
                    {[sender.district, sender.division].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="primary"
                size="sm"
                disabled={isPending && pendingId === request.id}
                onClick={() => handleAction(request.id, "accept")}
                className={cn("w-full sm:w-auto", isPending && pendingId === request.id ? "opacity-80" : "")}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending && pendingId === request.id}
                onClick={() => handleAction(request.id, "decline")}
                className={cn("w-full sm:w-auto", isPending && pendingId === request.id ? "opacity-80" : "")}
              >
                Decline
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
