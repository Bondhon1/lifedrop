"use client";

import { useMemo, useRef, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { updateDonorApplication } from "@/server/actions/donor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

const statusStyles: Record<string, string> = {
  Pending: "bg-warning-soft text-warning border border-warning",
  Approved: "bg-success-soft text-success border border-success",
  Rejected: "bg-danger-soft text-[var(--color-text-danger)] border border-danger",
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
};

const formatInputDate = (value: string | null | undefined) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

export type DonorProfileManagerProps = {
  application: {
    id: number;
    status: string;
    dateOfBirth: string;
    hasDonatedBefore: boolean;
    lastDonationDate: string | null;
    medicalConditions: string | null;
    medicalHistoryImages: string[];
    nidOrBirthCertificate: string;
    updatedAt: string;
  };
};

export function DonorProfileManager({ application }: DonorProfileManagerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const statusBadgeClass = useMemo(
    () => statusStyles[application.status] ?? "bg-surface-primary-soft text-primary border border-[var(--color-border-primary)]",
    [application.status],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);

    startTransition(async () => {
      const result = await updateDonorApplication(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    });
  };

  const medicalHistoryItems = application.medicalHistoryImages?.filter(Boolean) ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Donor status</p>
          <p className="text-lg font-semibold text-primary">Stay verification-ready</p>
        </div>
        <Badge className={statusBadgeClass}>{application.status}</Badge>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-5 text-sm text-[var(--color-text-secondary)] md:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Date of birth</dt>
          <dd className="text-primary">{formatDate(application.dateOfBirth)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Donation history</dt>
          <dd className="text-primary">{application.hasDonatedBefore ? "Has donated before" : "New donor"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Last donation</dt>
          <dd className="text-primary">{formatDate(application.lastDonationDate)}</dd>
        </div>
      </dl>

      <div className="grid gap-3 rounded-2xl border border-soft bg-surface-card-muted p-5">
        <h3 className="text-base font-semibold text-primary">Identity & Documents</h3>
        <div className="text-sm text-secondary">
          <p className="mb-2">We keep your documents secure. Only admins can view them for verification.</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href={application.nidOrBirthCertificate}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] px-3 py-1 text-secondary transition hover:bg-surface-primary-soft hover:text-primary"
            >
              View ID document
            </Link>
            {medicalHistoryItems.length > 0
              ? medicalHistoryItems.map((item, index) => (
                <Link
                  key={`${item}-${index}`}
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] px-3 py-1 text-secondary transition hover:bg-surface-primary-soft hover:text-primary"
                >
                  Medical file {index + 1}
                </Link>
              ))
              : <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-surface-primary-soft px-3 py-1 text-muted">No medical attachments yet</span>}
          </div>
        </div>
      </div>

      {application.status === "Approved" ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="grid gap-4 rounded-2xl border border-success bg-success-soft p-5"
        >
          <input type="hidden" name="applicationId" value={application.id} />
          <h3 className="text-base font-semibold text-primary">Keep your availability up to date</h3>
          <p className="text-sm text-secondary">
            Update your last donation and add any recent medical notes so coordinators can match you quickly.
          </p>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lastDonationDate">Last donation date</Label>
              <Input
                id="lastDonationDate"
                name="lastDonationDate"
                type="date"
                defaultValue={formatInputDate(application.lastDonationDate)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medicalHistoryImages">Add new medical attachments</Label>
              <Input id="medicalHistoryImages" name="medicalHistoryImages" type="file" accept="image/*" multiple />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="medicalConditions">Medical notes</Label>
            <Textarea
              id="medicalConditions"
              name="medicalConditions"
              placeholder="Describe any medications or health updates."
              defaultValue={application.medicalConditions ?? ""}
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save updates"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-warning bg-warning-soft p-5 text-sm text-secondary">
          {application.status === "Pending"
            ? "Your application is under review. We will notify you once it is approved."
            : "Your previous application needs attention. Contact support to reapply."}
        </div>
      )}
    </div>
  );
}
