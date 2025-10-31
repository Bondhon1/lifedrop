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
    <Card className="bg-slate-950/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          Signing you out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-slate-200">
        <p>Logging you out of the admin console now. You’ll be back at the admin sign-in screen in a moment.</p>
      </CardContent>
    </Card>
  );
}
