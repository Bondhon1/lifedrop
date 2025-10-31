import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeFileName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  if (base.length === 0) {
    return "upload";
  }
  return base.slice(-64);
}

export async function saveImageFile(file: File, folder: string): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  if (file.size === 0) {
    throw new Error("Empty file");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image exceeds 5MB limit");
  }

  if (file.type && !ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error("Unsupported image type");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = path.parse(file.name || "upload.png");
  const baseName = sanitizeFileName(parsed.name || "upload");
  const fileName = `${randomUUID()}-${baseName}`.slice(0, 64) + (parsed.ext ? parsed.ext.toLowerCase() : ".png");
  const safeFolder = folder
    .split(/[\\/]+/)
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/");
  const targetFolder = safeFolder || "misc";
  const dirPath = path.join(UPLOAD_ROOT, targetFolder);
  await ensureDir(dirPath);
  const absolutePath = path.join(dirPath, fileName);
  await fs.writeFile(absolutePath, buffer);

  return `/uploads/${targetFolder}/${fileName}`;
}

export async function deleteStoredFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  if (!relativePath.startsWith("/uploads/")) {
    return;
  }

  const absolutePath = path.join(process.cwd(), "public", relativePath);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("deleteStoredFile:error", error);
    }
  }
}

export function buildAbsoluteUrl(pathname: string) {
  const baseFromEnv = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL
      ? process.env.VERCEL_URL.startsWith("http")
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`
      : undefined);

  const base = baseFromEnv ?? `http://localhost:${process.env.PORT ?? 3000}`;

  if (pathname.startsWith("http")) {
    return pathname;
  }

  return `${base.replace(/\/$/, "")}${pathname}`;
}
