import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { del as deleteBlob, put as uploadBlob } from "@vercel/blob";

const UPLOAD_PREFIX = (process.env.BLOB_UPLOAD_PREFIX ?? "uploads").replace(/^\/+|\/+$/g, "") || "uploads";
const UPLOAD_ROOT = path.join(process.cwd(), "public", UPLOAD_PREFIX);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? null;
const USE_BLOB_STORAGE = Boolean(BLOB_TOKEN);
const RUNNING_ON_VERCEL = process.env.VERCEL === "1";
const ALLOW_LOCAL_STORAGE = !RUNNING_ON_VERCEL;

const PATH_PREFIX_CANDIDATES = ["profiles", "covers", "requests", "medical", "nid", "comments", "chat", "chat_attachments", "chat_images"];
const PUBLIC_STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.replace(/\/$/, "")
  ?? process.env.BLOB_PUBLIC_BASE_URL?.replace(/\/$/, "")
  ?? null;

export function normalizeStoredKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const withoutLeadingSlash = trimmed.replace(/^\/+/, "");

  if (withoutLeadingSlash.startsWith("public/")) {
    return normalizeStoredKey(withoutLeadingSlash.replace(/^public\//, ""));
  }

  if (withoutLeadingSlash.startsWith(`${UPLOAD_PREFIX}/`)) {
    return withoutLeadingSlash;
  }

  if (withoutLeadingSlash.startsWith("uploads/")) {
    return withoutLeadingSlash;
  }

  if (PATH_PREFIX_CANDIDATES.some((prefix) => withoutLeadingSlash.startsWith(`${prefix}/`))) {
    return `${UPLOAD_PREFIX}/${withoutLeadingSlash}`;
  }

  return withoutLeadingSlash;
}

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
  const blobKey = [UPLOAD_PREFIX, targetFolder, fileName].filter(Boolean).join("/");

  if (USE_BLOB_STORAGE) {
    try {
      const blob = await uploadBlob(blobKey, buffer, {
        access: "public",
        token: BLOB_TOKEN ?? undefined,
        contentType: file.type || "application/octet-stream",
      });
      return blobKey;
    } catch (error) {
      console.error("saveImageFile:blob", error);
      throw new Error("Blob upload failed");
    }
  }

  if (!ALLOW_LOCAL_STORAGE) {
    throw new Error("Blob storage is not configured for this environment.");
  }

  try {
    const dirPath = path.join(UPLOAD_ROOT, targetFolder);
    await ensureDir(dirPath);
    const absolutePath = path.join(dirPath, fileName);
    await fs.writeFile(absolutePath, buffer);
    return blobKey;
  } catch (error) {
    console.error("saveImageFile:local", error);
    throw new Error("Local storage write failed");
  }
}

export async function deleteStoredFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  const trimmed = relativePath.trim();
  if (!trimmed) return;

  if (trimmed.startsWith("http")) {
    if (USE_BLOB_STORAGE) {
      try {
        const url = new URL(trimmed);
        const key = normalizeStoredKey(url.pathname);
        await deleteBlob(key || trimmed, { token: BLOB_TOKEN ?? undefined });
      } catch (error) {
        console.error("deleteStoredFile:blob", error);
      }
    }
    return;
  }

  const normalized = normalizeStoredKey(trimmed);

  if (USE_BLOB_STORAGE) {
    try {
      await deleteBlob(normalized, { token: BLOB_TOKEN ?? undefined });
    } catch (error) {
      console.error("deleteStoredFile:blob", error);
    }
  }

  if (ALLOW_LOCAL_STORAGE && normalized.startsWith(`${UPLOAD_PREFIX}/`)) {
    const absolutePath = path.join(process.cwd(), "public", normalized);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("deleteStoredFile:error", error);
      }
    }
  }
}

export const storageEnvironment = {
  uploadPrefix: UPLOAD_PREFIX,
  useBlobStorage: USE_BLOB_STORAGE,
  allowLocalStorage: ALLOW_LOCAL_STORAGE,
  blobToken: BLOB_TOKEN ?? undefined,
  publicBaseUrl: PUBLIC_STORAGE_BASE,
};

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
