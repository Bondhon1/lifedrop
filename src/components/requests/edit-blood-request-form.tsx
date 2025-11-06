"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBloodRequest } from "@/server/actions/blood-request";
import { bloodRequestFormSchema, type BloodRequestFormInput } from "@/lib/validators/blood-request";
import { LocationPicker } from "@/components/requests/location-picker";
import type { BloodRequest, Divisions, Districts, Upazilas } from "@prisma/client";

type RequestWithRelations = Omit<BloodRequest, "amountNeeded" | "latitude" | "longitude"> & {
  amountNeeded: number;
  latitude: number | null;
  longitude: number | null;
  division: Divisions | null;
  district: Districts | null;
  upazila: Upazilas | null;
};

interface EditBloodRequestFormProps {
  request: RequestWithRelations;
}

export default function EditBloodRequestForm({ request }: EditBloodRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const methods = useForm<BloodRequestFormInput>({
    resolver: zodResolver(bloodRequestFormSchema),
    defaultValues: {
      patientName: request.patientName,
      gender: request.gender as "Male" | "Female" | "Other",
      requiredDate: request.requiredDate.toISOString().split('T')[0],
      bloodGroup: request.bloodGroup as any,
      amountNeeded: request.amountNeeded.toString(),
      hospitalName: request.hospitalName,
      urgencyStatus: request.urgencyStatus as any,
      smokerPreference: (request.smokerPreference || "Allow Smokers") as any,
      reason: request.reason || "",
      location: request.location,
      latitude: request.latitude?.toString() || "",
      longitude: request.longitude?.toString() || "",
      divisionId: request.divisionId?.toString() || "",
      districtId: request.districtId?.toString() || "",
      upazilaId: request.upazilaId?.toString() || "",
      addressLabel: request.location,
    },
  });

  async function onSubmit(data: BloodRequestFormInput) {
    setError("");
    setFieldErrors([]);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value.toString());
      }
    });

    // Add images if any
    const imageInput = document.querySelector<HTMLInputElement>('input[name="images"]');
    if (imageInput?.files) {
      Array.from(imageInput.files).forEach(file => {
        formData.append("images", file);
      });
    }

    startTransition(async () => {
      const result = await updateBloodRequest(request.id, formData);

      if (result.ok) {
        router.push(`/requests/${request.id}`);
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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
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
        <h2 className="text-xl font-semibold text-foreground">Patient Information</h2>

        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-foreground mb-1">
            Patient Name *
          </label>
          <input
            type="text"
            id="patientName"
            {...methods.register("patientName")}
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-1">
              Gender *
            </label>
            <select
              id="gender"
              {...methods.register("gender")}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="bloodGroup" className="block text-sm font-medium text-foreground mb-1">
              Blood Group *
            </label>
            <select
              id="bloodGroup"
              {...methods.register("bloodGroup")}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="requiredDate" className="block text-sm font-medium text-foreground mb-1">
              Required Date *
            </label>
            <input
              type="date"
              id="requiredDate"
              {...methods.register("requiredDate")}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="amountNeeded" className="block text-sm font-medium text-foreground mb-1">
              Amount Needed (bags) *
            </label>
            <input
              type="number"
              id="amountNeeded"
              {...methods.register("amountNeeded")}
              min="1"
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Hospital & Location</h2>

        <div>
          <label htmlFor="hospitalName" className="block text-sm font-medium text-foreground mb-1">
            Hospital Name *
          </label>
          <input
            type="text"
            id="hospitalName"
            {...methods.register("hospitalName")}
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Location/Address * <span className="text-xs text-muted-foreground">(Click map or use current location)</span>
          </label>
          <LocationPicker onError={setError} />
        </div>
      </div>

      <div className="bg-surface-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Additional Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="urgencyStatus" className="block text-sm font-medium text-foreground mb-1">
              Urgency Status *
            </label>
            <select
              id="urgencyStatus"
              {...methods.register("urgencyStatus")}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="smokerPreference" className="block text-sm font-medium text-foreground mb-1">
              Smoker Preference *
            </label>
            <select
              id="smokerPreference"
              {...methods.register("smokerPreference")}
              className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Allow Smokers">Allow Smokers</option>
              <option value="Avoid Smokers">Avoid Smokers</option>
              <option value="No smokers">No smokers</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-foreground mb-1">
            Reason for Blood Request
          </label>
          <textarea
            id="reason"
            {...methods.register("reason")}
            rows={4}
            placeholder="e.g., Surgery, Accident, Anemia treatment..."
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-foreground mb-1">
            Add More Images (optional)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Current images: {request.images.length} | You can add up to {6 - request.images.length} more
          </p>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={request.images.length >= 6}
            className="w-full px-4 py-2 bg-surface-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG or WebP. Max 5MB per image.
          </p>
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
          {isPending ? "Updating..." : "Update Blood Request"}
        </button>
      </div>
      </form>
    </FormProvider>
  );
}
