"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { resolveReport, removeReportedRequest } from "@/server/actions/admin";
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

  if (reports.length === 0) {
    return (
      <Card className="border border-emerald-500/25 bg-emerald-500/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-emerald-900">No active reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-900/80">
          Great news! The community hasn’t flagged any requests. Keep an eye here for future alerts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <p className="rounded-2xl border border-rose-400/40 bg-rose-500/15 p-3 text-sm text-rose-50">{error}</p>
      ) : null}
      {reports.map((report) => {
        const isProcessing = isPending && activeId === report.id;
        const reportedAt = format(new Date(report.createdAt), "MMM d, yyyy h:mm a");
        const reporterName = report.reporter?.name ?? report.reporter?.username ?? "Anonymous";

        return (
          <Card key={report.id} className="border border-rose-500/25 bg-rose-950/70 shadow-xl shadow-rose-950/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-2">
                  <CardTitle className="text-lg font-semibold text-white">Report #{report.id}</CardTitle>
                  <p className="text-sm text-rose-100/80">Filed by {reporterName} on {reportedAt}</p>
                </div>
                {report.request ? (
                  <Badge variant="secondary" className="bg-rose-500/20 text-rose-50">Request #{report.request.id}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100/85">
                {report.reason}
              </div>

              {report.request ? (
                <div className="grid gap-2 rounded-2xl border border-rose-500/20 bg-rose-950/60 p-4 text-sm text-rose-100/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{report.request.patientName}</p>
                    <Badge variant="secondary" className="bg-rose-500/20 text-rose-50">{report.request.status}</Badge>
                  </div>
                  <p>Hospital: {report.request.hospitalName}</p>
                  <p>Posted by {report.request.author}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="bg-rose-500/20 text-rose-50 hover:bg-rose-500/30"
                      asChild
                    >
                      <a href={`/requests/${report.request.id}`} target="_blank" rel="noopener noreferrer">Open request</a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-rose-400/40 text-rose-100 hover:bg-rose-500/20"
                      disabled={isProcessing}
                      onClick={() => handleResolve(report.id, true)}
                    >
                      {isProcessing ? "Removing…" : "Remove request"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-rose-400/40 text-rose-100 hover:bg-rose-500/20"
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
