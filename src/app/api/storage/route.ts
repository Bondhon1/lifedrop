import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeStoredKey, storageEnvironment } from "@/lib/storage";

export const runtime = "nodejs";

const IMAGE_MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function inferContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_MIME_MAP[ext] ?? "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");

  if (!keyParam) {
    return new NextResponse("Missing key", { status: 400 });
  }

  const decoded = decodeURIComponent(keyParam);

  if (/^https?:\/\//i.test(decoded)) {
    return NextResponse.redirect(decoded, 302);
  }

  const normalized = normalizeStoredKey(decoded);

  if (storageEnvironment.useBlobStorage) {
    try {
      const metadata = await head(normalized, { token: storageEnvironment.blobToken });
      return NextResponse.redirect(metadata.downloadUrl ?? metadata.url, 302);
    } catch (error) {
      console.error("storage proxy blob", error);
    }
  }

  if (storageEnvironment.allowLocalStorage) {
    const absolutePath = path.join(process.cwd(), "public", normalized);
    try {
      const file = await fs.readFile(absolutePath);
      return new NextResponse(file, {
        headers: {
          "Content-Type": inferContentType(absolutePath),
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    } catch (error) {
      console.error("storage proxy local", error);
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
