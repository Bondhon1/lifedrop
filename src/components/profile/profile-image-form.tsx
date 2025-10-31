"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { updateProfileImages } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const normalizeImagePath = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
};

type ProfileImageFormProps = {
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
};

export function ProfileImageForm({ profilePictureUrl, coverPhotoUrl }: ProfileImageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const baseProfileUrlRef = useRef(profilePictureUrl);
  const baseCoverUrlRef = useRef(coverPhotoUrl);

  const profileObjectUrlRef = useRef<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);

  const [profilePreview, setProfilePreview] = useState(profilePictureUrl);
  const [coverPreview, setCoverPreview] = useState(coverPhotoUrl);

  useEffect(() => {
    baseProfileUrlRef.current = profilePictureUrl;
    baseCoverUrlRef.current = coverPhotoUrl;
    setProfilePreview(profilePictureUrl);
    setCoverPreview(coverPhotoUrl);
  }, [profilePictureUrl, coverPhotoUrl]);

  useEffect(() => {
    return () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
      }
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
      }
    };
  }, []);

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
      profileObjectUrlRef.current = null;
    }

    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      profileObjectUrlRef.current = url;
      setProfilePreview(url);
    } else {
      setProfilePreview(baseProfileUrlRef.current ?? null);
    }
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }

    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      coverObjectUrlRef.current = url;
      setCoverPreview(url);
    } else {
      setCoverPreview(baseCoverUrlRef.current ?? null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateProfileImages(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const updatedProfile = normalizeImagePath(result.data.profilePicture);
      const updatedCover = normalizeImagePath(result.data.coverPhoto);

      if (updatedProfile) {
        if (profileObjectUrlRef.current) {
          URL.revokeObjectURL(profileObjectUrlRef.current);
          profileObjectUrlRef.current = null;
        }
        baseProfileUrlRef.current = updatedProfile;
        setProfilePreview(updatedProfile);
      } else if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
        profileObjectUrlRef.current = null;
        setProfilePreview(baseProfileUrlRef.current ?? null);
      }

      if (updatedCover) {
        if (coverObjectUrlRef.current) {
          URL.revokeObjectURL(coverObjectUrlRef.current);
          coverObjectUrlRef.current = null;
        }
        baseCoverUrlRef.current = updatedCover;
        setCoverPreview(updatedCover);
      } else if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
        coverObjectUrlRef.current = null;
        setCoverPreview(baseCoverUrlRef.current ?? null);
      }

      toast.success("Images updated");
      form.reset();
      router.refresh();
    });
  };

  return (
    <section className="grid gap-6 rounded-3xl border border-rose-500/25 bg-rose-950/70 p-6 shadow-xl shadow-rose-900/40">
      <header className="grid gap-1">
        <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">Images</p>
        <h2 className="text-2xl font-semibold text-white">Refresh your visuals</h2>
        <p className="text-sm text-rose-100/80">
          Add a friendly profile photo and cover image to help friends recognize you instantly.
        </p>
      </header>
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="relative h-40 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-900/40">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-rose-100/60">No profile photo yet</div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profilePicture">Profile photo</Label>
              <Input id="profilePicture" name="profilePicture" type="file" accept="image/*" onChange={handleProfileChange} />
              <p className="text-xs text-rose-100/60">JPG, PNG, WebP or GIF up to 5MB.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="relative h-40 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-900/40">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-rose-100/60">No cover image yet</div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverPhoto">Cover image</Label>
              <Input id="coverPhoto" name="coverPhoto" type="file" accept="image/*" onChange={handleCoverChange} />
              <p className="text-xs text-rose-100/60">Wide image works best. JPG, PNG, WebP or GIF up to 5MB.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Uploading…" : "Save images"}
          </Button>
        </div>
      </form>
    </section>
  );
}
