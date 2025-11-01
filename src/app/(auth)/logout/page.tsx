"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
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
        <p>Hang tight—we’re ending your session and bringing you back to the sign-in screen.</p>
      </CardContent>
    </Card>
  );
}
