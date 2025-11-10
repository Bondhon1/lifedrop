"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-semibold">Choose a new password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and unique to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
