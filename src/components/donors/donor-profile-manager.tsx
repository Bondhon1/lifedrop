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
  Pending: "bg-amber-500/20 text-amber-200",
  Approved: "bg-emerald-500/20 text-emerald-200",
  Rejected: "bg-rose-500/20 text-rose-200",
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

  const statusBadgeClass = useMemo(() => statusStyles[application.status] ?? "bg-rose-500/20 text-rose-100", [application.status]);

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
          <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Donor status</p>
          <p className="text-lg font-semibold text-white">Stay verification-ready</p>
        </div>
        <Badge className={statusBadgeClass}>{application.status}</Badge>
      </div>

      <dl className="grid gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 text-sm text-rose-100/80 md:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-rose-200/70">Date of birth</dt>
          <dd className="text-white">{formatDate(application.dateOfBirth)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-rose-200/70">Donation history</dt>
          <dd className="text-white">{application.hasDonatedBefore ? "Has donated before" : "New donor"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-rose-200/70">Last donation</dt>
          <dd className="text-white">{formatDate(application.lastDonationDate)}</dd>
        </div>
      </dl>

      <div className="grid gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-5">
        <h3 className="text-base font-semibold text-white">Identity & Documents</h3>
        <div className="text-sm text-rose-100/80">
          <p className="mb-2">We keep your documents secure. Only admins can view them for verification.</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href={application.nidOrBirthCertificate}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 px-3 py-1 text-rose-100/80 hover:border-rose-300/80 hover:text-white"
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
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-3 py-1 text-rose-100/80 hover:border-rose-300/70 hover:text-white"
                >
                  Medical file {index + 1}
                </Link>
              ))
              : <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 px-3 py-1 text-rose-100/60">No medical attachments yet</span>}
          </div>
        </div>
      </div>

      {application.status === "Approved" ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="grid gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5"
        >
          <input type="hidden" name="applicationId" value={application.id} />
          <h3 className="text-base font-semibold text-white">Keep your availability up to date</h3>
          <p className="text-sm text-emerald-100/80">
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
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-100/80">
          {application.status === "Pending"
            ? "Your application is under review. We will notify you once it is approved."
            : "Your previous application needs attention. Contact support to reapply."}
        </div>
      )}
    </div>
  );
}
