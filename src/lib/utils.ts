import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves image paths to proper URLs, handling old default values and different path formats
 * @param path - The image path from database (can be null, relative, or absolute)
 * @returns Resolved URL or null if path is empty/default
 */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  // Handle old default values from database
  if (!trimmed || trimmed === "default.jpg" || trimmed === "default_cover.jpg") {
    return null;
  }
  // Return absolute URLs as-is
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  // Prepend /uploads/ for relative paths
  return `/uploads/${trimmed}`;
}
