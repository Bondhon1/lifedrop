"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { resolveImageUrl } from "@/lib/utils";
import { approveDonorApplication, rejectDonorApplication } from "@/server/actions/donor";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-100",
  Approved: "bg-emerald-500/20 text-emerald-100",
  Rejected: "bg-rose-500/20 text-rose-100",
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(parsed);
};

export type PendingDonorApplication = {
  id: number;
  submittedAt: string;
  dateOfBirth: string;
  hasDonatedBefore: boolean;
  lastDonationDate: string | null;
  medicalConditions: string | null;
  medicalHistoryImages: string[];
  nidOrBirthCertificate: string;
  status: string;
  user: {
    id: number;
    username: string;
    name: string | null;
    email: string;
    phone: string | null;
    bloodGroup: string | null;
    division: string | null;
    district: string | null;
    upazila: string | null;
    profilePicture: string | null;
  };
};

type PendingDonorApplicationsListProps = {
  applications: PendingDonorApplication[];
};

export function PendingDonorApplicationsList({ applications }: PendingDonorApplicationsListProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDecision = (applicationId: number, decision: "approve" | "reject") => {
    if (decision === "reject" && !window.confirm("Are you sure you want to reject this donor application?")) {
      return;
    }

    setActionError(null);
    setActiveId(applicationId);

    startTransition(async () => {
      const result = decision === "approve"
        ? await approveDonorApplication(applicationId)
        : await rejectDonorApplication(applicationId);

      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        setActiveId(null);
        return;
      }

      toast.success(result.data.message);
      setActiveId(null);
      router.refresh();
    });
  };

  if (applications.length === 0) {
    return (
      <Card className="border border-rose-500/25 bg-rose-500/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">No pending applications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-rose-100/80">
          All donor applications are up to date. You will be notified when new submissions arrive.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {actionError ? (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/50 p-3 text-sm text-rose-100">{actionError}</p>
      ) : null}

      {applications.map((application) => {
        const avatar = resolveImageUrl(application.user.profilePicture);
        const displayName = application.user.name?.trim() ? application.user.name : application.user.username;
        const location = [application.user.upazila, application.user.district, application.user.division]
          .filter(Boolean)
          .join(", ");
        const medicalDocuments = application.medicalHistoryImages?.filter(Boolean) ?? [];

        return (
          <Card key={application.id} className="border border-rose-500/25 bg-rose-950/70 shadow-xl shadow-rose-950/30">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar
                  src={avatar ?? undefined}
                  alt={displayName ?? "Applicant"}
                  size="lg"
                  className="border border-rose-500/30 bg-rose-900/60"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold text-white">{displayName}</CardTitle>
                    {application.user.bloodGroup ? (
                      <Badge className="bg-rose-500/20 text-rose-50">{application.user.bloodGroup}</Badge>
                    ) : null}
                    <Badge className={statusStyles[application.status] ?? "bg-rose-500/20 text-rose-100"}>{application.status}</Badge>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-rose-200/70">@{application.user.username}</p>
                  <p className="text-xs text-rose-200/70">Submitted {formatDateTime(application.submittedAt)}</p>
                  {location ? <p className="text-sm text-rose-100/70">{location}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.user.email ? (
                  <Badge variant="secondary" className="border-rose-500/30 text-rose-100/80">{application.user.email}</Badge>
                ) : null}
                {application.user.phone ? (
                  <Badge variant="secondary" className="border-rose-500/30 text-rose-100/80">{application.user.phone}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-100/80 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-rose-200/70">Date of birth</p>
                  <p className="text-white">{formatDate(application.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-rose-200/70">Donation history</p>
                  <p className="text-white">{application.hasDonatedBefore ? "Donated before" : "New donor"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-rose-200/70">Last donation</p>
                  <p className="text-white">{formatDate(application.lastDonationDate)}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/60 p-4">
                <h3 className="text-sm font-semibold text-white">Medical notes</h3>
                <p className="text-sm text-rose-100/80">
                  {application.medicalConditions ?? "No notes provided."}
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/60 p-4">
                <h3 className="text-sm font-semibold text-white">Documents</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={application.nidOrBirthCertificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-1 text-rose-100/80 hover:border-rose-300/70 hover:text-white"
                  >
                    View ID document
                  </Link>
                  {medicalDocuments.length > 0 ? (
                    medicalDocuments.map((item, index) => (
                      <Link
                        key={`${application.id}-medical-${index}`}
                        href={item}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-3 py-1 text-rose-100/80 hover:border-rose-300/70 hover:text-white"
                      >
                        Medical file {index + 1}
                      </Link>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-rose-500/20 px-3 py-1 text-rose-100/60">
                      No medical attachments
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isPending && activeId === application.id}
                  onClick={() => handleDecision(application.id, "approve")}
                >
                  {isPending && activeId === application.id ? "Approving…" : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-400/50 text-rose-100 hover:bg-rose-500/20"
                  disabled={isPending && activeId === application.id}
                  onClick={() => handleDecision(application.id, "reject")}
                >
                  {isPending && activeId === application.id ? "Processing…" : "Reject"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
