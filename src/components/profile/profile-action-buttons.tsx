"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelFriendRequest,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/server/actions/friend";

export type FriendStatus = "self" | "friends" | "incoming" | "outgoing" | "none";

type ProfileActionButtonsProps = {
  status: FriendStatus;
  targetUserId: number;
  pendingRequestId?: number | null;
  friendSince?: string | null;
};

export function ProfileActionButtons({
  status,
  targetUserId,
  pendingRequestId = null,
  friendSince = null,
}: ProfileActionButtonsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status === "self") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/profile">Edit your profile</Link>
        </Button>
        <p className="text-xs text-rose-100/70">This is how others see your profile.</p>
      </div>
    );
  }

  const handleAction = (action: () => Promise<void>) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        console.error("ProfileActionButtons:action", error);
        setFeedback("Something went wrong. Please try again.");
      }
    });
  };

  const chatDisabled = status !== "friends";

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {status === "none" ? (
          <Button
            disabled={isPending}
            onClick={() =>
              handleAction(async () => {
                const result = await sendFriendRequest(targetUserId);
                if (!result.ok) {
                  setFeedback(result.message);
                  return;
                }
                setFeedback("Request sent.");
              })
            }
          >
            {isPending ? "Sending…" : "Add friend"}
          </Button>
        ) : null}

        {status === "outgoing" ? (
          <>
            <Button disabled variant="secondary">
              Request pending
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                handleAction(async () => {
                  if (!pendingRequestId) return;
                  const result = await cancelFriendRequest(pendingRequestId);
                  if (!result.ok) {
                    setFeedback(result.message);
                    return;
                  }
                  setFeedback("Request cancelled.");
                })
              }
            >
              Cancel request
            </Button>
          </>
        ) : null}

        {status === "incoming" ? (
          <>
            <Button
              disabled={isPending}
              onClick={() =>
                handleAction(async () => {
                  if (!pendingRequestId) return;
                  const result = await respondToFriendRequest(pendingRequestId, "accept");
                  if (!result.ok) {
                    setFeedback(result.message);
                    return;
                  }
                  setFeedback("You are now connected.");
                })
              }
            >
              Accept request
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                handleAction(async () => {
                  if (!pendingRequestId) return;
                  const result = await respondToFriendRequest(pendingRequestId, "decline");
                  if (!result.ok) {
                    setFeedback(result.message);
                    return;
                  }
                  setFeedback("Request declined.");
                })
              }
            >
              Decline
            </Button>
          </>
        ) : null}

        {status === "friends" ? (
          <>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                handleAction(async () => {
                  const result = await removeFriend(targetUserId);
                  if (!result.ok) {
                    setFeedback(result.message);
                    return;
                  }
                  setFeedback("Removed from friends.");
                })
              }
            >
              Remove friend
            </Button>
            {friendSince ? (
              <p className="text-xs text-emerald-200/80">
                Friends since {new Date(friendSince).toLocaleDateString()}
              </p>
            ) : null}
          </>
        ) : null}

        {chatDisabled ? (
          <Button variant="secondary" disabled className="cursor-not-allowed opacity-70">
            Chat available after connecting
          </Button>
        ) : (
          <Button variant="primary" asChild>
            <Link href={`/chat?user=${targetUserId}`}>Open chat</Link>
          </Button>
        )}
      </div>
      {feedback ? <p className="text-xs text-rose-100/70">{feedback}</p> : null}
    </div>
  );
}
