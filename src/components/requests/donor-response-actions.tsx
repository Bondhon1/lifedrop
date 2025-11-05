"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { updateDonorResponseStatus } from "@/server/actions/blood-request";
import { Check, X } from "lucide-react";

type DonorResponseActionsProps = {
  responseId: number;
  donorId: number;
  requestId: number;
  donorName: string;
  donorEmail: string;
  donorPhone: string | null;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterName: string;
  patientName: string;
};

export function DonorResponseActions({
  responseId,
  donorId,
  requestId,
  donorName,
  donorEmail,
  donorPhone,
  requesterEmail,
  requesterPhone,
  requesterName,
  patientName,
}: DonorResponseActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"Pending" | "Accepted" | "Declined">("Pending");

  const handleAction = (action: "Accepted" | "Declined") => {
    startTransition(async () => {
      const result = await updateDonorResponseStatus(responseId, action, {
        donorId,
        requestId,
        donorName,
        donorEmail,
        donorPhone,
        requesterEmail,
        requesterPhone,
        requesterName,
        patientName,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setStatus(action);
      const message = action === "Accepted"
        ? `Donor accepted! Both parties will receive contact information via email.`
        : `Donor declined.`;
      toast.success(message);
      router.refresh();
    });
  };

  if (status !== "Pending") {
    return (
      <span className={`text-xs font-semibold ${status === "Accepted" ? "text-green-600" : "text-red-600"}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        onClick={() => handleAction("Accepted")}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
        title="Accept this donor"
      >
        <Check className="h-4 w-4" />
        <span className="sr-only">Accept</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAction("Declined")}
        disabled={isPending}
        className="border-red-600 text-red-600 hover:bg-red-50"
        title="Decline this donor"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Decline</span>
      </Button>
    </div>
  );
}
