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
      <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft p-8 text-center">
        <h3 className="text-lg font-semibold text-primary">No pending friend requests</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          When someone sends you a request to connect it will show up right here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error && (
        <p className="rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-3 text-sm text-[var(--color-text-secondary)]">
          {error}
        </p>
      )}
      {requests.map((request) => {
        const { sender } = request;
        const avatar = resolveAvatar(sender.profilePicture);
        const displayName = sender.name?.trim() && sender.name.length > 0 ? sender.name : sender.username;

        return (
          <article
            key={request.id}
            className="flex flex-col gap-4 rounded-3xl border border-soft bg-surface-card p-4 shadow-soft md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <Avatar src={avatar ?? undefined} alt={sender.name ?? sender.username} size="lg" />
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold text-primary">{sender.name ?? sender.username}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                  {sender.bloodGroup ? <span className="font-medium text-primary">Blood group {sender.bloodGroup}</span> : null}
                  <span className="text-muted">Requested {friendlyDate(request.createdAt)}</span>
                </div>
                {(sender.district || sender.division) && (
                  <p className="mt-1 truncate text-sm text-muted">
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
