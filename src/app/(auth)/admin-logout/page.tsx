"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/admin-login" });
  }, []);

  return (
    <Card className="bg-white/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-[#2E2E2E]">
          <Loader2 className="h-6 w-6 animate-spin text-[#D31027]" />
          Signing you out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-[#5F5F5F]">
        <p>Logging you out of the admin console now. You’ll be back at the admin sign-in screen in a moment.</p>
      </CardContent>
    </Card>
  );
}
