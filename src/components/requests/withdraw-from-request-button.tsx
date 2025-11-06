"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawFromRequest } from "@/server/actions/blood-request";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WithdrawFromRequestButtonProps {
  requestId: number;
  patientName: string;
}

export function WithdrawFromRequestButton({ requestId, patientName }: WithdrawFromRequestButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string>("");

  const handleWithdraw = () => {
    setError("");
    startTransition(async () => {
      const result = await withdrawFromRequest(requestId);
      
      if (result.ok) {
        setShowDialog(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="mt-2"
      >
        Withdraw from Request
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Blood Request?</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw from the blood request for {patientName}? 
              This action cannot be undone and the requester will be notified.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-xl p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleWithdraw}
              disabled={isPending}
            >
              {isPending ? "Withdrawing..." : "Yes, Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
