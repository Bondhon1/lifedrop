"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { resolveImageUrl } from "@/lib/utils";
import { removeFriend } from "@/server/actions/friend";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type FriendListItem = {
  id: number;
  username: string;
  name: string | null;
  email: string;
  bloodGroup: string | null;
  district?: string | null;
  division?: string | null;
  profilePicture: string | null;
};

type FriendListProps = {
  friends: FriendListItem[];
};

export function FriendList({ friends }: FriendListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRemove = (friendId: number) => {
    setError(null);
    setPendingId(friendId);

    startTransition(async () => {
      const result = await removeFriend(friendId);
      if (!result.ok) {
        setError(result.message);
        setPendingId(null);
        return;
      }

      setPendingId(null);
      router.refresh();
    });
  };

  if (friends.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--color-border-primary)] bg-surface-primary-soft p-10 text-center">
        <h3 className="text-lg font-semibold text-primary">No connections yet</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          As you accept requests your confirmed connections will appear here.
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
      {friends.map((friend) => {
        const displayName = friend.name?.trim() && friend.name.length > 0 ? friend.name : friend.username;
        const avatar = resolveImageUrl(friend.profilePicture);

        return (
          <article
            key={friend.id}
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
                <p className="truncate text-sm text-secondary">{friend.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {friend.bloodGroup ? <span className="text-secondary">Blood group {friend.bloodGroup}</span> : null}
                  {(friend.district || friend.division) && (
                    <span>{[friend.district, friend.division].filter(Boolean).join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                <Link href={`/members/${friend.username}`}>View profile</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending && pendingId === friend.id}
                onClick={() => handleRemove(friend.id)}
                className="w-full sm:w-auto"
              >
                Remove
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
