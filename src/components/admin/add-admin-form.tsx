"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createAdminAccount } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions/types";

const initialState: ActionState<{ message: string }> | null = null;

type AddAdminFormProps = {
  existingCount: number;
};

export function AddAdminForm({ existingCount }: AddAdminFormProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState(null);

    startTransition(async () => {
      const result = await createAdminAccount(formData);
      setState(result);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.data.message);
      form.reset();
      router.refresh();
    });
  };

  return (
    <Card className="border border-rose-500/25 bg-rose-950/70 shadow-xl shadow-rose-950/30">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Invite a new admin</CardTitle>
        <p className="text-sm text-rose-100/75">You currently have {existingCount} admin{existingCount === 1 ? "" : "s"}. Share responsibility with another trusted teammate.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {state && !state.ok ? (
            <p className="rounded-2xl border border-rose-400/50 bg-rose-500/20 p-3 text-sm text-rose-50">{state.message}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="admin-username" className="text-sm font-medium text-rose-100/80">Username</Label>
            <Input
              id="admin-username"
              name="username"
              placeholder="lifedrop-admin"
              minLength={3}
              maxLength={32}
              required
              autoComplete="username"
              className="border-rose-500/40 bg-rose-900/40 text-white placeholder:text-rose-100/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-email" className="text-sm font-medium text-rose-100/80">Email</Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              placeholder="admin@lifedrop.org"
              required
              autoComplete="email"
              className="border-rose-500/40 bg-rose-900/40 text-white placeholder:text-rose-100/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-password" className="text-sm font-medium text-rose-100/80">Temporary password</Label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              placeholder="Set an initial password"
              minLength={8}
              required
              autoComplete="new-password"
              className="border-rose-500/40 bg-rose-900/40 text-white placeholder:text-rose-100/40"
            />
            <p className="text-xs text-rose-100/60">Ask the admin to change this password after their first login.</p>
          </div>

          <Button type="submit" disabled={isPending} className="bg-[var(--color-primary-start)] text-white hover:bg-[var(--color-primary-end)]">
            {isPending ? "Creating account…" : "Add admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
