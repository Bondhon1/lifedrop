"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { updateProfile } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const resolveLocationLabel = (parts: Array<string | null>) =>
  parts.filter((part): part is string => typeof part === "string" && part.trim().length > 0).join(", ");

type LocationOptions = {
  divisions: Array<{ id: number; name: string }>;
  districts: Array<{ id: number; name: string; divisionId: number }>;
  upazilas: Array<{ id: number; name: string; districtId: number }>;
};

export type ProfileInfoFormProps = {
  profile: {
    name: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    bloodGroup: string;
    medicalHistory: string;
    divisionId: number | null;
    districtId: number | null;
    upazilaId: number | null;
  };
  bloodGroups: readonly string[];
  locationOptions: LocationOptions;
};

export function ProfileInfoForm({ profile, bloodGroups, locationOptions }: ProfileInfoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [divisionId, setDivisionId] = useState(profile.divisionId ? String(profile.divisionId) : "");
  const [districtId, setDistrictId] = useState(profile.districtId ? String(profile.districtId) : "");
  const [upazilaId, setUpazilaId] = useState(profile.upazilaId ? String(profile.upazilaId) : "");

  const districtOptions = useMemo(() => {
    if (!divisionId) {
      return locationOptions.districts;
    }
    const divisionNumeric = Number(divisionId);
    return locationOptions.districts.filter((district) => district.divisionId === divisionNumeric);
  }, [divisionId, locationOptions.districts]);

  const upazilaOptions = useMemo(() => {
    if (!districtId) {
      return locationOptions.upazilas;
    }
    const districtNumeric = Number(districtId);
    return locationOptions.upazilas.filter((upazila) => upazila.districtId === districtNumeric);
  }, [districtId, locationOptions.upazilas]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (divisionId) {
      formData.set("divisionId", divisionId);
    } else {
      formData.delete("divisionId");
    }

    if (districtId) {
      formData.set("districtId", districtId);
    } else {
      formData.delete("districtId");
    }

    if (upazilaId) {
      formData.set("upazilaId", upazilaId);
    } else {
      formData.delete("upazilaId");
    }

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    });
  };

  const locationLabel = resolveLocationLabel([
    upazilaId
      ? upazilaOptions.find((entry) => entry.id === Number(upazilaId))?.name ?? null
      : profile.upazilaId
        ? locationOptions.upazilas.find((entry) => entry.id === profile.upazilaId)?.name ?? null
        : null,
    districtId
      ? districtOptions.find((entry) => entry.id === Number(districtId))?.name ?? null
      : profile.districtId
        ? locationOptions.districts.find((entry) => entry.id === profile.districtId)?.name ?? null
        : null,
    divisionId
      ? locationOptions.divisions.find((entry) => entry.id === Number(divisionId))?.name ?? null
      : profile.divisionId
        ? locationOptions.divisions.find((entry) => entry.id === profile.divisionId)?.name ?? null
        : null,
  ]);

  return (
    <section className="grid gap-6 rounded-3xl border border-rose-500/25 bg-rose-950/70 p-6 shadow-xl shadow-rose-900/40">
      <header className="grid gap-1">
        <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Profile</p>
        <h2 className="text-2xl font-semibold text-white">Keep your details current</h2>
        <p className="text-sm text-rose-100/80">
          Share the right contact and location details so coordinators and nearby donors can reach you quickly.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" name="name" placeholder="Your full name" defaultValue={profile.name} autoComplete="name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="01XXXXXXXXX" defaultValue={profile.phone} autoComplete="tel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Street, area" defaultValue={profile.address} autoComplete="street-address" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bloodGroup">Blood group</Label>
            <Select id="bloodGroup" name="bloodGroup" defaultValue={profile.bloodGroup || ""}>
              <option value="">Not shared</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="divisionId">Division</Label>
            <Select
              id="divisionId"
              name="divisionId"
              value={divisionId}
              onChange={(event) => {
                setDivisionId(event.target.value);
                setDistrictId("");
                setUpazilaId("");
              }}
            >
              <option value="">Select division</option>
              {locationOptions.divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="districtId">District</Label>
            <Select
              id="districtId"
              name="districtId"
              value={districtId}
              onChange={(event) => {
                setDistrictId(event.target.value);
                setUpazilaId("");
              }}
              disabled={divisionId.length === 0 && districtOptions.length === 0}
            >
              <option value="">Select district</option>
              {districtOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="upazilaId">Upazila</Label>
            <Select
              id="upazilaId"
              name="upazilaId"
              value={upazilaId}
              onChange={(event) => setUpazilaId(event.target.value)}
              disabled={districtId.length === 0 && upazilaOptions.length === 0}
            >
              <option value="">Select upazila</option>
              {upazilaOptions.map((upazila) => (
                <option key={upazila.id} value={upazila.id}>
                  {upazila.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="medicalHistory">Medical notes</Label>
          <Textarea
            id="medicalHistory"
            name="medicalHistory"
            rows={4}
            placeholder="Add any ongoing medications, allergies, or donor-specific notes."
            defaultValue={profile.medicalHistory}
          />
          <p className="text-xs text-rose-100/60">
            Visible only to you unless you choose to share directly with coordinators.
          </p>
        </div>

        <div className="grid gap-1 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs text-rose-100/70">
          <p>
            {locationLabel
              ? `Current location: ${locationLabel}`
              : "Add your division, district, and upazila to help match you with nearby requests."}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </section>
  );
}
