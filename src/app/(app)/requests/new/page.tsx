"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import {
  bloodGroups,
  bloodRequestFormSchema,
  genderOptions,
  smokerPreferences,
  urgencyLevels,
  type BloodRequestFormInput,
  type BloodRequestFormValues,
} from "@/lib/validators/blood-request";
import { createBloodRequest } from "@/server/actions/blood-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/requests/location-picker";

const tomorrow = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
})();

export default function NewBloodRequestPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const form = useForm<BloodRequestFormInput>({
    resolver: zodResolver(bloodRequestFormSchema),
    defaultValues: {
      patientName: "",
      gender: "Male",
      requiredDate: tomorrow.toISOString().split("T")[0],
      bloodGroup: "O+",
      amountNeeded: 1,
      hospitalName: "",
      urgencyStatus: "Urgent",
      smokerPreference: "Allow Smokers",
      reason: "",
      location: "",
      latitude: "",
      longitude: "",
      divisionId: "",
      districtId: "",
      upazilaId: "",
      addressLabel: "",
    },
  });

  const onSubmit = (values: BloodRequestFormInput) => {
    const parsed = bloodRequestFormSchema.parse(values);

    const formData = new FormData();
    formData.set("patientName", parsed.patientName);
    formData.set("gender", parsed.gender);
    formData.set("requiredDate", parsed.requiredDate.toISOString().split("T")[0]);
    formData.set("bloodGroup", parsed.bloodGroup);
    formData.set("amountNeeded", parsed.amountNeeded.toString());
    formData.set("hospitalName", parsed.hospitalName);
    formData.set("urgencyStatus", parsed.urgencyStatus);
    formData.set("smokerPreference", parsed.smokerPreference);
    formData.set("reason", parsed.reason);
    formData.set("location", parsed.location);
    formData.set("latitude", String(parsed.latitude));
    formData.set("longitude", String(parsed.longitude));
    if (parsed.divisionId) {
      formData.set("divisionId", String(parsed.divisionId));
    }
    if (parsed.districtId) {
      formData.set("districtId", String(parsed.districtId));
    }
    if (parsed.upazilaId) {
      formData.set("upazilaId", String(parsed.upazilaId));
    }
    if (parsed.addressLabel) {
      formData.set("addressLabel", parsed.addressLabel);
    }

    const files = imageInputRef.current?.files;
    if (files) {
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });
    }

    startTransition(async () => {
      const result = await createBloodRequest(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Blood request published");
      router.push(`/requests/${result.data.id}`);
      router.refresh();
    });
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      setSelectedImages([]);
      return;
    }

    const limited = Array.from(files).slice(0, 6);
    if (files.length > 6) {
      toast.error("Only the first 6 images will be uploaded.");
      const dt = new DataTransfer();
      limited.forEach((file) => dt.items.add(file));
      event.target.files = dt.files;
    }

    setSelectedImages(limited.map((file) => file.name));
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card className="border border-rose-500/25 bg-rose-950/70 shadow-2xl shadow-rose-900/40">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-white">Publish a blood request</CardTitle>
          <p className="text-sm text-rose-100/80">
            Share clear details so nearby donors can step in quickly. You can edit or close this request later.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" encType="multipart/form-data">
              <div className="grid gap-5 md:grid-cols-2">
                <FormItem>
                  <FormLabel htmlFor="patientName">Patient name</FormLabel>
                  <Input id="patientName" placeholder="John Doe" autoComplete="off" {...form.register("patientName")} />
                  <FormMessage>{form.formState.errors.patientName?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="gender">Gender</FormLabel>
                  <Select id="gender" {...form.register("gender")}>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                  <FormMessage>{form.formState.errors.gender?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="requiredDate">Required date</FormLabel>
                  <Input id="requiredDate" type="date" {...form.register("requiredDate")} />
                  <FormMessage>{form.formState.errors.requiredDate?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="bloodGroup">Blood group</FormLabel>
                  <Select id="bloodGroup" {...form.register("bloodGroup")}>
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </Select>
                  <FormMessage>{form.formState.errors.bloodGroup?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="amountNeeded">Units needed</FormLabel>
                  <Input
                    id="amountNeeded"
                    type="number"
                    min={0.5}
                    step={0.5}
                    {...form.register("amountNeeded", { valueAsNumber: true })}
                  />
                  <FormMessage>{form.formState.errors.amountNeeded?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="hospitalName">Hospital or clinic</FormLabel>
                  <Input id="hospitalName" placeholder="City Hospital" {...form.register("hospitalName")} />
                  <FormMessage>{form.formState.errors.hospitalName?.message}</FormMessage>
                </FormItem>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormItem>
                  <FormLabel htmlFor="urgencyStatus">Urgency level</FormLabel>
                  <Select id="urgencyStatus" {...form.register("urgencyStatus")}>
                    {urgencyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                  <FormMessage>{form.formState.errors.urgencyStatus?.message}</FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="smokerPreference">Smoker preference</FormLabel>
                  <Select id="smokerPreference" {...form.register("smokerPreference")}>
                    {smokerPreferences.map((preference) => (
                      <option key={preference} value={preference}>
                        {preference}
                      </option>
                    ))}
                  </Select>
                  <FormMessage>{form.formState.errors.smokerPreference?.message}</FormMessage>
                </FormItem>
              </div>

              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  <span>Hospital location</span>
                  <span className="text-xs font-medium uppercase tracking-widest text-rose-200/80">Powered by OpenStreetMap</span>
                </FormLabel>
                <div className="grid gap-3">
                  <LocationPicker onError={(message: string) => toast.error(message)} />
                  <input type="hidden" {...form.register("latitude")} />
                  <input type="hidden" {...form.register("longitude")} />
                  <input type="hidden" {...form.register("divisionId")} />
                  <input type="hidden" {...form.register("districtId")} />
                  <input type="hidden" {...form.register("upazilaId")} />
                  <input type="hidden" {...form.register("addressLabel")} />
                  <FormMessage>
                    {form.formState.errors.location?.message ||
                      form.formState.errors.latitude?.message ||
                      form.formState.errors.longitude?.message}
                  </FormMessage>
                </div>
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="reason">Situation details</FormLabel>
                <Textarea
                  id="reason"
                  rows={5}
                  placeholder="Explain the medical condition, support information, and any coordination details donors should know."
                  {...form.register("reason")}
                />
                <FormMessage>{form.formState.errors.reason?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="images">Supporting media</FormLabel>
                <Input
                  id="images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  ref={imageInputRef}
                  onChange={handleImagesChange}
                />
                <p className="text-xs text-rose-100/70">Add up to 6 photos to help volunteers understand the case.</p>
                {selectedImages.length > 0 ? (
                  <ul className="space-y-1 text-xs text-rose-100/80">
                    {selectedImages.map((fileName) => (
                      <li key={fileName} className="truncate">
                        {fileName}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </FormItem>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" className="border border-rose-400/50" onClick={() => router.back()} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Publishing…" : "Publish request"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
