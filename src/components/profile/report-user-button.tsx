"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ReportUserButtonProps = {
  targetUserId: number;
  targetDisplayName: string;
};

export function ReportUserButton({ targetUserId, targetDisplayName }: ReportUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmed = reason.trim();

    if (trimmed.length < 10) {
      toast.error("Please share a short explanation (at least 10 characters).");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportedUserId: targetUserId,
            reason: trimmed,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Unable to file report." }));
          toast.error(data.error ?? "Unable to file report.");
          return;
        }

        toast.success("Report submitted. The admin team will review it.");
        setReason("");
        setOpen(false);
      } catch (error) {
        console.error("ReportUserButton:submit", error);
        toast.error("We couldn't send that report right now. Please try again.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="border-[var(--color-danger-border)] text-[var(--color-text-danger)] hover:bg-[var(--color-danger-bg)]"
      >
        <Flag className="mr-2 h-4 w-4" />
        Report to admin
      </Button>

      <Dialog open={open} onOpenChange={(value) => (!isPending ? setOpen(value) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report profile</DialogTitle>
            <DialogDescription>
              Let the admin team know why {targetDisplayName} should be reviewed. We never share your name.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Share what happened or why this profile needs attention."
            rows={5}
            className="mt-4 resize-none"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Sending…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
