"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { resolveImageUrl } from "@/lib/utils";
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
      <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft p-8 text-center text-sm text-[var(--color-text-secondary)]">
        You have not sent any pending requests.
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
        const { receiver } = request;
        const avatar = resolveImageUrl(receiver.profilePicture);
        const displayName = receiver.name?.trim() && receiver.name.length > 0 ? receiver.name : receiver.username;

        return (
          <article
            key={request.id}
            className="flex flex-col gap-4 rounded-3xl border border-soft bg-surface-card p-4 shadow-soft md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 items-center gap-4">
              <Avatar
                src={avatar ?? undefined}
                alt={displayName}
                size="lg"
                className="border border-[var(--color-border-primary)] bg-surface-card-muted"
              />
              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold text-primary">{displayName}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
                  {receiver.bloodGroup ? <span className="text-primary">Blood group {receiver.bloodGroup}</span> : null}
                  <span className="text-muted">Sent {friendlyDate(request.createdAt)}</span>
                </div>
                {(receiver.district || receiver.division) && (
                  <p className="mt-1 truncate text-sm text-muted">
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
