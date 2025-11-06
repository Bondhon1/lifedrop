"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { referDonor } from "@/server/actions/blood-request";

interface ReferDonorFormProps {
  requestId: number;
  requestUserId: number;
}

export default function ReferDonorForm({ requestId, requestUserId }: ReferDonorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await referDonor(requestId, requestUserId, formData);

      if (result.ok) {
        router.push(`/requests/${requestId}`);
        router.refresh();
      } else {
        setError(result.message);
        if (result.issues) {
          setFieldErrors(result.issues);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-xl p-4">
          <p className="text-destructive font-medium">{error}</p>
          {fieldErrors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {fieldErrors.map((err, i) => (
                <li key={i} className="text-sm text-destructive">
                  • {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-surface-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Donor Information</h2>

        <div>
          <label htmlFor="donorName" className="block text-sm font-medium text-foreground mb-1">
            Donor Name *
          </label>
          <input
            type="text"
            id="donorName"
            name="donorName"
            required
            placeholder="Full name of the person you're referring"
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="donorPhone" className="block text-sm font-medium text-foreground mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="donorPhone"
            name="donorPhone"
            required
            placeholder="e.g., +8801712345678"
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This number will be shared with the requester
          </p>
        </div>

        <div>
          <label htmlFor="donorEmail" className="block text-sm font-medium text-foreground mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            id="donorEmail"
            name="donorEmail"
            placeholder="donor@example.com"
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-foreground mb-1">
            Your Relationship to Donor
          </label>
          <select
            id="relationship"
            name="relationship"
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Friend">Friend</option>
            <option value="Family">Family Member</option>
            <option value="Colleague">Colleague</option>
            <option value="Acquaintance">Acquaintance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
            Additional Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Any additional information about the donor (e.g., last donation date, availability, location)"
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Important Information
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Please ensure you have the donor&apos;s consent before referring</li>
            <li>• The requester will be notified and may contact the donor directly</li>
            <li>• Make sure the contact information is accurate</li>
            <li>• False referrals may result in account suspension</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-6 py-2.5 border border-border rounded-xl font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Referral"}
        </button>
      </div>
    </form>
  );
}
