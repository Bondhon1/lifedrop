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
  Pending: "border-warning bg-warning-soft text-warning",
  Approved: "border-success bg-success-soft text-success",
  Rejected: "border-danger bg-danger-soft text-danger",
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
      <Card className="bg-surface-card-muted">
        <CardHeader>
          <CardTitle>No pending applications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-secondary">
          All donor applications are up to date. You will be notified when new submissions arrive.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {actionError ? (
        <p className="rounded-2xl border border-danger bg-danger-soft p-3 text-sm text-danger">{actionError}</p>
      ) : null}

      {applications.map((application) => {
        const avatar = resolveImageUrl(application.user.profilePicture);
        const displayName = application.user.name?.trim() ? application.user.name : application.user.username;
        const location = [application.user.upazila, application.user.district, application.user.division]
          .filter(Boolean)
          .join(", ");
        const medicalDocuments = application.medicalHistoryImages?.filter(Boolean) ?? [];

        return (
          <Card key={application.id}>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar src={avatar ?? undefined} alt={displayName ?? "Applicant"} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{displayName}</CardTitle>
                    {application.user.bloodGroup ? <Badge variant="secondary">{application.user.bloodGroup}</Badge> : null}
                    <Badge
                      variant="outline"
                      className={statusStyles[application.status] ?? "border-soft bg-surface-card-muted text-secondary"}
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted">@{application.user.username}</p>
                  <p className="text-xs text-muted">Submitted {formatDateTime(application.submittedAt)}</p>
                  {location ? <p className="text-sm text-secondary">{location}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.user.email ? <Badge variant="secondary">{application.user.email}</Badge> : null}
                {application.user.phone ? <Badge variant="secondary">{application.user.phone}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 rounded-2xl border border-soft bg-surface-card-muted p-4 text-sm text-secondary md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Date of birth</p>
                  <p className="text-primary">{formatDate(application.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Donation history</p>
                  <p className="text-primary">{application.hasDonatedBefore ? "Donated before" : "New donor"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Last donation</p>
                  <p className="text-primary">{formatDate(application.lastDonationDate)}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-soft bg-surface-card-muted p-4">
                <h3 className="text-sm font-semibold text-primary">Medical notes</h3>
                <p className="text-sm text-secondary">{application.medicalConditions ?? "No notes provided."}</p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-soft bg-surface-card-muted p-4">
                <h3 className="text-sm font-semibold text-primary">Documents</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={application.nidOrBirthCertificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-soft px-3 py-1 text-primary transition-colors hover:bg-surface-primary-soft"
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
                        className="inline-flex items-center gap-2 rounded-full border border-soft px-3 py-1 text-primary transition-colors hover:bg-surface-primary-soft"
                      >
                        Medical file {index + 1}
                      </Link>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-soft px-3 py-1 text-muted">
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
