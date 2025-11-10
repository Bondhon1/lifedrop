"use client";

import { useMemo, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { resolveImageUrl } from "@/lib/utils";
import { removeUserAccount } from "@/server/actions/admin";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export type AdminUserSummary = {
  id: number;
  username: string;
  name: string | null;
  email: string;
  phone: string | null;
  bloodGroup: string | null;
  profilePicture: string | null;
  createdAt: string;
  role: string;
  donorStatus: string | null;
  requestCount: number;
  responseCount: number;
};

type UserDirectoryTableProps = {
  users: AdminUserSummary[];
};

export function UserDirectoryTable({ users }: UserDirectoryTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    if (!query.trim()) {
      return users;
    }
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(term)
        || (user.name ?? "").toLowerCase().includes(term)
        || user.email.toLowerCase().includes(term)
        || (user.phone ?? "").toLowerCase().includes(term)
        || (user.bloodGroup ?? "").toLowerCase().includes(term)
      );
    });
  }, [users, query]);

  const handleRemove = (userId: number, username: string) => {
    if (!window.confirm(`Remove ${username}? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    setActiveId(userId);

    startTransition(async () => {
      const result = await removeUserAccount(userId);
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

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-soft bg-surface-card p-4 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Search members</p>
          <p className="text-sm text-secondary">Filter by name, email, blood group, or phone.</p>
        </div>
        <Input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder="Search community members"
          className="w-full md:w-72"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-danger bg-danger-soft p-3 text-sm text-danger">{error}</p>
      ) : null}

      {filteredUsers.length === 0 ? (
        <Card className="bg-surface-card-muted">
          <CardContent className="p-6 text-sm text-secondary">No members match your search.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => {
            const avatar = resolveImageUrl(user.profilePicture);
            const displayName = user.name?.trim() ? user.name : user.username;
            const joined = format(new Date(user.createdAt), "MMM d, yyyy");

            return (
              <Card
                key={user.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 items-start gap-4">
                  <Avatar src={avatar ?? undefined} alt={displayName} />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-primary">{displayName}</p>
                      <Badge variant="secondary">@{user.username}</Badge>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-secondary">
                      <span>{user.email}</span>
                      {user.phone ? <span>{user.phone}</span> : null}
                      <span>Joined {joined}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted">
                      {user.bloodGroup ? <Badge variant="secondary">Blood: {user.bloodGroup}</Badge> : null}
                      {user.donorStatus ? (
                        <Badge variant="outline" className="border-success bg-success-soft text-success">Donor: {user.donorStatus}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning bg-warning-soft text-warning">No donor profile</Badge>
                      )}
                      <Badge variant="secondary">Requests: {user.requestCount}</Badge>
                      <Badge variant="secondary">Responses: {user.responseCount}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending && activeId === user.id}
                    onClick={() => handleRemove(user.id, user.username)}
                  >
                    {isPending && activeId === user.id ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    asChild
                  >
                    <a href={`/members/${user.username}`} target="_blank" rel="noopener noreferrer">View profile</a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
