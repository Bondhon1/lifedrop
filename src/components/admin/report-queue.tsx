"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  resolveReport,
  removeReportedRequest,
  removeDonorProfile,
  removeUserAccount,
} from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AdminReportSummary = {
  id: number;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    name: string | null;
    email: string | null;
  } | null;
  request: {
    id: number;
    patientName: string;
    status: string;
    hospitalName: string;
    author: string;
  } | null;
  member: {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    bloodGroup: string | null;
    donorStatus: string | null;
  } | null;
};

type ReportQueueProps = {
  reports: AdminReportSummary[];
};

export function ReportQueue({ reports }: ReportQueueProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResolve = (reportId: number, destructive = false) => {
    if (destructive) {
      const confirmed = window.confirm("Remove this blood request and clear related reports? This cannot be undone.");
      if (!confirmed) {
        return;
      }
    }

    setError(null);
    setActiveId(reportId);

    const action = destructive ? removeReportedRequest : resolveReport;

    startTransition(async () => {
      const result = await action(reportId);
      setActiveId(null);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    });
  };

  const handleMemberAction = (report: AdminReportSummary, action: "remove-donor" | "remove-user") => {
    if (!report.member) {
      return;
    }

    const confirmationMessage =
      action === "remove-user"
        ? "Delete this member account and clear related reports? This cannot be undone."
        : "Remove the donor profile for this member? This revokes their donor status.";

    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) {
      return;
    }

    setError(null);
    setActiveId(report.id);

    startTransition(async () => {
      try {
        const outcome =
          action === "remove-user"
            ? await removeUserAccount(report.member!.id)
            : await removeDonorProfile(report.member!.id);

        if (!outcome.ok) {
          setError(outcome.message);
          toast.error(outcome.message);
          setActiveId(null);
          return;
        }

        const resolution = await resolveReport(report.id);
        if (!resolution.ok) {
          setError(resolution.message);
          toast.error(resolution.message);
          setActiveId(null);
          return;
        }

        toast.success(`${outcome.data.message} Report resolved.`);
        setActiveId(null);
        router.refresh();
      } catch (error) {
        console.error("ReportQueue:memberAction", error);
        setError("We couldn't complete that action. Please try again.");
        toast.error("We couldn't complete that action. Please try again.");
        setActiveId(null);
      }
    });
  };

  if (reports.length === 0) {
    return (
      <Card className="bg-success-soft border-success">
        <CardHeader>
          <CardTitle className="text-lg text-success">No active reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-success">
          Great news! The community hasn’t flagged any requests. Keep an eye here for future alerts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <p className="rounded-2xl border border-danger bg-danger-soft p-3 text-sm text-danger">{error}</p>
      ) : null}
      {reports.map((report) => {
        const isProcessing = isPending && activeId === report.id;
        const reportedAt = format(new Date(report.createdAt), "MMM d, yyyy h:mm a");
        const reporterName = report.reporter?.name ?? report.reporter?.username ?? "Anonymous";

        return (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-2">
                  <CardTitle className="text-lg">Report #{report.id}</CardTitle>
                  <p className="text-sm text-secondary">Filed by {reporterName} on {reportedAt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.request ? <Badge variant="secondary">Request #{report.request.id}</Badge> : null}
                  {report.member ? <Badge variant="secondary">@{report.member.username}</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-2xl border border-warning bg-warning-soft p-4 text-sm text-warning">
                {report.reason}
              </div>

              {report.request ? (
                <div className="grid gap-2 rounded-2xl border border-soft bg-surface-card-muted p-4 text-sm text-secondary">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">{report.request.patientName}</p>
                    <Badge variant="secondary">{report.request.status}</Badge>
                  </div>
                  <p>Hospital: {report.request.hospitalName}</p>
                  <p>Posted by {report.request.author}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <a href={`/requests/${report.request.id}`} target="_blank" rel="noopener noreferrer">Open request</a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleResolve(report.id, true)}
                    >
                      {isProcessing ? "Removing…" : "Remove request"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {report.member ? (
                <div className="grid gap-2 rounded-2xl border border-soft bg-surface-card-muted p-4 text-sm text-secondary">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">{report.member.name ?? report.member.username}</p>
                    <Badge variant="secondary">@{report.member.username}</Badge>
                    {report.member.bloodGroup ? (
                      <Badge variant="secondary">Blood {report.member.bloodGroup}</Badge>
                    ) : null}
                    {report.member.donorStatus ? (
                      <Badge variant="secondary">{report.member.donorStatus}</Badge>
                    ) : null}
                  </div>
                  {report.member.email ? <p>Email: {report.member.email}</p> : null}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <Button type="button" variant="secondary" size="sm" asChild>
                      <a href={`/members/${report.member.username}`} target="_blank" rel="noopener noreferrer">Open profile</a>
                    </Button>
                    {report.member.donorStatus ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleMemberAction(report, "remove-donor")}
                      >
                        {isProcessing ? "Processing…" : "Remove donor profile"}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleMemberAction(report, "remove-user")}
                    >
                      {isProcessing ? "Deleting…" : "Delete account"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleResolve(report.id)}
                >
                  {isProcessing ? "Resolving…" : "Resolve"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
