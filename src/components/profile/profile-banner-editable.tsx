"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import { Avatar } from "@/components/ui/avatar";
import { resolveImageUrl } from "@/lib/utils";
import { updateProfileImages } from "@/server/actions/profile";

const DEFAULT_AVATAR = "/images/default-avatar.svg";
const DEFAULT_COVER = "/images/default-cover.svg";

const IMAGE_CONFIG = {
  profilePicture: {
    fallback: DEFAULT_AVATAR,
    successMessage: "Profile photo updated",
  },
  coverPhoto: {
    fallback: DEFAULT_COVER,
    successMessage: "Cover image updated",
  },
} as const;

type EditableField = keyof typeof IMAGE_CONFIG;

type ProfileBannerEditableProps = {
  displayName: string;
  username: string;
  email: string;
  lastUpdatedLabel: string;
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
};

export function ProfileBannerEditable({
  displayName,
  username,
  email,
  lastUpdatedLabel,
  profilePictureUrl,
  coverPhotoUrl,
}: ProfileBannerEditableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const baseProfileRef = useRef(profilePictureUrl ?? DEFAULT_AVATAR);
  const baseCoverRef = useRef(coverPhotoUrl ?? DEFAULT_COVER);

  const profileObjectUrlRef = useRef<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);

  const [profilePreview, setProfilePreview] = useState(baseProfileRef.current);
  const [coverPreview, setCoverPreview] = useState(baseCoverRef.current);
  const [profileUploading, setProfileUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    baseProfileRef.current = profilePictureUrl ?? DEFAULT_AVATAR;
    baseCoverRef.current = coverPhotoUrl ?? DEFAULT_COVER;
    setProfilePreview(baseProfileRef.current);
    setCoverPreview(baseCoverRef.current);
  }, [profilePictureUrl, coverPhotoUrl]);

  useEffect(() => () => {
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
    }
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
    }
  }, []);

  const revertPreview = (field: EditableField) => {
    if (field === "profilePicture") {
      setProfilePreview(baseProfileRef.current);
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
        profileObjectUrlRef.current = null;
      }
    } else {
      setCoverPreview(baseCoverRef.current);
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
        coverObjectUrlRef.current = null;
      }
    }
  };

  const handleFileChange = (field: EditableField) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      revertPreview(field);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (field === "profilePicture") {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
      }
      profileObjectUrlRef.current = localUrl;
      setProfilePreview(localUrl);
      setProfileUploading(true);
    } else {
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
      }
      coverObjectUrlRef.current = localUrl;
      setCoverPreview(localUrl);
      setCoverUploading(true);
    }

    const formData = new FormData();
    formData.append(field, file);

    startTransition(async () => {
      try {
        const result = await updateProfileImages(formData);
        if (!result.ok) {
          toast.error(result.message);
          revertPreview(field);
          return;
        }

        const updatedPath = field === "profilePicture" ? result.data.profilePicture : result.data.coverPhoto;
        if (field === "profilePicture") {
          if (profileObjectUrlRef.current) {
            URL.revokeObjectURL(profileObjectUrlRef.current);
            profileObjectUrlRef.current = null;
          }
          baseProfileRef.current = resolveImageUrl(updatedPath) ?? DEFAULT_AVATAR;
          setProfilePreview(baseProfileRef.current);
        } else {
          if (coverObjectUrlRef.current) {
            URL.revokeObjectURL(coverObjectUrlRef.current);
            coverObjectUrlRef.current = null;
          }
          baseCoverRef.current = resolveImageUrl(updatedPath) ?? DEFAULT_COVER;
          setCoverPreview(baseCoverRef.current);
        }

        toast.success(IMAGE_CONFIG[field].successMessage);
        router.refresh();
      } catch (error) {
        console.error("ProfileBannerEditable:update", error);
        toast.error("We couldn't update that image. Please try again.");
        revertPreview(field);
      } finally {
        if (field === "profilePicture") {
          setProfileUploading(false);
        } else {
          setCoverUploading(false);
        }
      }
    });
  };

  const isUploading = isPending || profileUploading || coverUploading;

  return (
    <section className="overflow-hidden rounded-3xl border border-soft bg-surface-card shadow-soft">
      <div className="group relative h-48 w-full">
        <Image
          src={coverPreview}
          alt="Cover photo"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 px-4 text-center text-sm font-semibold text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          aria-label="Change cover image"
        >
          <span>{coverUploading ? "Uploading…" : "Change cover"}</span>
          <span className="text-[11px] font-normal text-white/80">Wide image, max 5MB</span>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange("coverPhoto")}
        />
      </div>

      <div className="relative px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="group relative flex-shrink-0">
            <Avatar
              src={profilePreview}
              alt={displayName}
              size="lg"
              className="h-24 w-24 border-4 border-[var(--color-border-primary)] bg-surface-card-muted shadow-soft"
            />
            <button
              type="button"
              onClick={() => profileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/65 px-3 text-center text-xs font-semibold text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              aria-label="Change profile photo"
            >
              {profileUploading ? "Uploading…" : "Change photo"}
            </button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange("profilePicture")}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold text-primary">{displayName}</h1>
            <p className="truncate text-sm text-secondary">{email}</p>
            <p className="mt-1 text-xs text-muted">Last updated {lastUpdatedLabel}</p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="rounded-full bg-surface-primary-soft px-3 py-1 text-xs font-semibold text-primary">@{username}</span>
            {isUploading ? <span className="text-xs text-muted">Saving changes…</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
