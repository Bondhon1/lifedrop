"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  UserPlus, 
  Flag 
} from "lucide-react";
import { deleteBloodRequest, markDonorFound } from "@/server/actions/blood-request";

interface BloodRequestOptionsProps {
  requestId: number;
  isOwner: boolean;
  status: string;
  amountNeeded: number;
}

export function BloodRequestOptions({ requestId, isOwner, status, amountNeeded }: BloodRequestOptionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarkFoundDialog, setShowMarkFoundDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [donorsFound, setDonorsFound] = useState(amountNeeded);
  const [reportReason, setReportReason] = useState("");

  const handleEdit = () => {
    router.push(`/requests/${requestId}/edit`);
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteBloodRequest(requestId);
        if (result.ok) {
          toast.success("Blood request deleted successfully");
          setShowDeleteDialog(false);
          router.refresh();
        } else {
          toast.error(result.message || "Failed to delete request");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the request");
        console.error("Delete error:", error);
      }
    });
  };

  const handleMarkDonorFound = () => {
    if (!donorsFound || donorsFound < 1 || donorsFound > amountNeeded) {
      toast.error(`Please enter a valid number between 1 and ${amountNeeded}`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await markDonorFound(requestId, donorsFound);
        if (result.ok) {
          const remaining = amountNeeded - donorsFound;
          if (remaining === 0) {
            toast.success("Request marked as fulfilled!");
          } else {
            toast.success(`${donorsFound} donor(s) marked. ${remaining} still needed.`);
          }
          setShowMarkFoundDialog(false);
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update request");
        }
      } catch (error) {
        toast.error("An error occurred");
        console.error("Mark found error:", error);
      }
    });
  };

  const handleReferDonor = () => {
    router.push(`/requests/${requestId}/refer`);
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };

  const handleSubmitReport = () => {
    if (!reportReason.trim() || reportReason.trim().length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            reason: reportReason.trim(),
          }),
        });

        if (response.ok) {
          toast.success("Report submitted. Admins will review it.");
          setShowReportDialog(false);
          setReportReason("");
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to submit report");
        }
      } catch (error) {
        toast.error("An error occurred while submitting the report");
        console.error("Report error:", error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-secondary hover:text-primary"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwner ? (
            <>
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit post
              </DropdownMenuItem>
              {status !== "Fulfilled" && status !== "Closed" && (
                <DropdownMenuItem
                  onClick={() => setShowMarkFoundDialog(true)}
                  className="cursor-pointer"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark donor found
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer text-[var(--color-text-danger)] focus:text-[var(--color-text-danger)]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete post
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleReferDonor} className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Refer a donor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleReport}
                className="cursor-pointer text-[var(--color-text-danger)] focus:text-[var(--color-text-danger)]"
              >
                <Flag className="mr-2 h-4 w-4" />
                Report to admin
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blood Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this blood request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Donor Found Dialog */}
      <Dialog open={showMarkFoundDialog} onOpenChange={setShowMarkFoundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Donors Found</DialogTitle>
            <DialogDescription>
              How many donors have you found? The request needs {amountNeeded} bag(s) of blood.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="donorsFound" className="block text-sm font-medium text-foreground mb-2">
              Number of Donors Found *
            </label>
            <input
              type="number"
              id="donorsFound"
              value={donorsFound}
              onChange={(e) => setDonorsFound(parseInt(e.target.value) || 0)}
              min="1"
              max={amountNeeded}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {donorsFound === amountNeeded 
                ? "This will mark the request as fulfilled." 
                : `${amountNeeded - donorsFound} bag(s) will still be needed after this update.`}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMarkFoundDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkDonorFound}
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Update Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report to Admin</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for reporting this blood request. Admins will review your report.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="reportReason" className="block text-sm font-medium text-foreground mb-2">
              Reason for Reporting *
            </label>
            <textarea
              id="reportReason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={5}
              placeholder="e.g., This request contains misleading information, spam, inappropriate content..."
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 10 characters. False reports may result in account suspension.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmitReport}
              disabled={isPending || reportReason.trim().length < 10}
            >
              {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
