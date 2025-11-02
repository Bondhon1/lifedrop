"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { deleteAdminAccount } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AdminSummary = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
};

type AdminDirectoryProps = {
  admins: AdminSummary[];
  currentAdminId: number | null;
};

export function AdminDirectory({ admins, currentAdminId }: AdminDirectoryProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRemove = (adminId: number) => {
    if (!window.confirm("Remove this admin account? They will lose access immediately.")) {
      return;
    }

    setError(null);
    setActiveId(adminId);

    startTransition(async () => {
      const result = await deleteAdminAccount(adminId);
      setActiveId(null);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    });
  };

  if (admins.length === 0) {
    return (
      <Card className="border border-rose-500/20 bg-rose-950/60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">No admin accounts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-rose-100/75">
          Invite at least one trusted teammate to help moderate requests and manage reports.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <p className="rounded-2xl border border-rose-400/50 bg-rose-500/15 p-3 text-sm text-rose-50">{error}</p>
      ) : null}
      {admins.map((admin) => {
        const isCurrent = currentAdminId === admin.id;
        const joinedLabel = formatDistanceToNow(new Date(admin.createdAt), { addSuffix: true });

        return (
          <Card
            key={admin.id}
            className="flex flex-col gap-3 border border-rose-500/25 bg-rose-950/70 p-4 transition shadow-xl shadow-rose-950/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-semibold text-white">{admin.username}</CardTitle>
                {isCurrent ? <Badge variant="secondary">You</Badge> : null}
              </div>
              <p className="text-sm text-rose-100/80">{admin.email}</p>
              <p className="text-xs uppercase tracking-wide text-rose-200/60">Joined {joinedLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-rose-400/40 text-rose-100 hover:bg-rose-500/20"
                disabled={isCurrent || (isPending && activeId === admin.id)}
                onClick={() => {
                  if (!isCurrent) {
                    handleRemove(admin.id);
                  }
                }}
              >
                {isPending && activeId === admin.id ? "Removing…" : "Remove"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
