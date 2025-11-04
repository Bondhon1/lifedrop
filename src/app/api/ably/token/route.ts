import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { createUserTokenRequest } from "@/lib/realtime";

const parseUserId = (raw: SessionUser["id"] | undefined): number | null => {
  if (typeof raw === "number" && Number.isInteger(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    if (raw.startsWith("admin:")) {
      const parsed = Number(raw.split(":")[1]);
      return Number.isInteger(parsed) ? parsed : null;
    }

    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
};

export async function GET() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = parseUserId(sessionUser?.id);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tokenRequest = await createUserTokenRequest(userId);
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Failed to create Ably token request", error);
    return NextResponse.json({ error: "Unable to initialize realtime connection" }, { status: 500 });
  }
}
