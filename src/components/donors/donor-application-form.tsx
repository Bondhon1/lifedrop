"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { submitDonorApplication } from "@/server/actions/donor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DonorApplicationForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [hasDonatedBefore, setHasDonatedBefore] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    formData.set("hasDonatedBefore", hasDonatedBefore ? "true" : "false");

    startTransition(async () => {
      try {
        const result = await submitDonorApplication(formData);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(result.data.message);
        formRef.current?.reset();
        setHasDonatedBefore(false);
        router.refresh();
      } catch (error) {
        console.error("DonorApplicationForm:submit", error);
        toast.error("We couldn't submit your application. Check your connection and try again.");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="grid gap-4">
      <input type="hidden" name="hasDonatedBefore" value={hasDonatedBefore ? "true" : "false"} />

      <div className="grid gap-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required aria-required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nidDocument">NID or birth certificate (image)</Label>
        <Input id="nidDocument" name="nidDocument" type="file" accept="image/*" required aria-required />
        <p className="text-xs text-muted">Accepted formats: JPG, PNG, or WEBP up to 5MB.</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="hasDonatedBeforeCheckbox"
          type="checkbox"
          className="h-4 w-4 rounded border border-soft bg-surface-primary-soft text-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)]"
          checked={hasDonatedBefore}
          onChange={(event) => setHasDonatedBefore(event.target.checked)}
        />
        <Label htmlFor="hasDonatedBeforeCheckbox" className="text-sm text-secondary">
          I&apos;ve donated blood before
        </Label>
      </div>

      {hasDonatedBefore ? (
        <div className="grid gap-2">
          <Label htmlFor="lastDonationDate">Last donation date</Label>
          <Input id="lastDonationDate" name="lastDonationDate" type="date" required aria-required />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="medicalConditions">Medical notes</Label>
        <Textarea
          id="medicalConditions"
          name="medicalConditions"
          placeholder="List any health notes or medications coordinators should know."
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="medicalHistoryImages">Supporting medical documents (optional)</Label>
        <Input id="medicalHistoryImages" name="medicalHistoryImages" type="file" accept="image/*" multiple />
        <p className="text-xs text-muted">Upload lab reports or doctor letters to speed up approval (max 5MB each).</p>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
