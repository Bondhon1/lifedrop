import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RELATIVE_UPLOAD_PREFIXES = [
  "profiles",
  "covers",
  "requests",
  "medical",
  "nid",
  "comments",
  "chat",
  "chat_attachments",
  "chat_images",
];

/**
 * Resolves image paths to proper URLs, handling old default values and different path formats
 * @param path - The image path from database (can be null, relative, or absolute)
 * @returns Resolved URL or null if path is empty/default
 */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === "default.jpg" || trimmed === "default_cover.jpg") {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const uploadPrefix = (process.env.BLOB_UPLOAD_PREFIX ?? "uploads").replace(/^\/+|\/+$/g, "") || "uploads";
  const storageBase =
    process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.replace(/\/$/, "")
    ?? process.env.BLOB_PUBLIC_BASE_URL?.replace(/\/$/, "")
    ?? null;

  let relative = trimmed.replace(/^\/+/, "");

  if (!relative) {
    return null;
  }

  if (relative.startsWith("public/")) {
    relative = relative.replace(/^public\//, "");
  }

  if (relative.includes("uploads/")) {
    const index = relative.indexOf("uploads/");
    relative = relative.slice(index);
  }

  if (!relative.startsWith(`${uploadPrefix}/`)) {
    if (RELATIVE_UPLOAD_PREFIXES.some((prefix) => relative.startsWith(`${prefix}/`))) {
      relative = `${uploadPrefix}/${relative}`;
    } else if (relative.startsWith("uploads/")) {
      // already normalized to uploads/
    } else {
      relative = `${uploadPrefix}/${relative}`;
    }
  }

  if (storageBase) {
    return `${storageBase}/${relative}`;
  }

  return `/${relative}`;
}
