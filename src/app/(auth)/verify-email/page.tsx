"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { verifyEmailToken } from "@/server/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VerifyState =
  | { status: "idle" }
  | { status: "missing" }
  | { status: "verifying" }
  | { status: "error"; message: string }
  | { status: "success"; email: string };

function VerifyEmailContent() {
  const searchParamsHook = useSearchParams();
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  const resolvedToken = useMemo(() => {
    const tokenFromParams = searchParamsHook ? searchParamsHook.get("token") : null;
    return (tokenFromParams ?? "").trim();
  }, [searchParamsHook]);

  useEffect(() => {
    if (!resolvedToken) {
      setState({ status: "missing" });
      return;
    }

    let cancelled = false;
    setState({ status: "verifying" });

    (async () => {
      try {
        const result = await verifyEmailToken(resolvedToken);
        if (cancelled) return;

        if (!result.ok) {
          setState({ status: "error", message: result.message });
          return;
        }

        setState({ status: "success", email: result.data.email });
      } catch (error) {
        console.error("VerifyEmailPage:verify", error);
        if (!cancelled) {
          setState({ status: "error", message: "We couldn’t verify your email right now. Please try again." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedToken]);

  if (state.status === "missing") {
    return (
      <Card className="bg-surface-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <XCircle className="h-6 w-6 text-[var(--color-primary-end)]" />
            Missing verification token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-secondary">
          <p>
            The verification link is incomplete. Please use the link we emailed you or request a new one from your profile settings.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="bg-surface-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <XCircle className="h-6 w-6 text-[var(--color-primary-end)]" />
            Verification failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-secondary">
          <p>{state.message}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/login">Back to login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile">Update profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "success") {
    return (
      <Card className="bg-surface-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <CheckCircle className="h-6 w-6 text-success" />
            Email verified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-secondary">
          <p>
            Thanks! <span className="font-semibold text-[var(--color-text-danger)]">{state.email}</span> is now verified. You can sign in and start using Lifedrop.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/feed">Open dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-secondary-start)]" />
          Verifying your email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-secondary">
        <p>Please wait… we are confirming your verification link.</p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="bg-surface-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-secondary-start)]" />
            Verifying your email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-secondary">
          <p>Please wait… we are confirming your verification link.</p>
        </CardContent>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
