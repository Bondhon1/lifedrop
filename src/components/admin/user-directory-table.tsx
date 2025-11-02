"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
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

const resolveAvatar = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
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
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/25 bg-rose-950/70 p-4 shadow-xl shadow-rose-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-200/70">Search members</p>
          <p className="text-sm text-rose-100/70">Filter by name, email, blood group, or phone.</p>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search community members"
          className="w-full border-rose-500/40 bg-rose-900/40 text-white placeholder:text-rose-100/40 md:w-72"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-400/40 bg-rose-500/20 p-3 text-sm text-rose-50">{error}</p>
      ) : null}

      {filteredUsers.length === 0 ? (
        <Card className="border border-rose-500/20 bg-rose-950/60">
          <CardContent className="p-6 text-sm text-rose-100/80">No members match your search.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => {
            const avatar = resolveAvatar(user.profilePicture);
            const displayName = user.name?.trim() ? user.name : user.username;
            const joined = format(new Date(user.createdAt), "MMM d, yyyy");

            return (
              <Card
                key={user.id}
                className="flex flex-col gap-4 border border-rose-500/25 bg-rose-950/70 p-4 shadow-xl shadow-rose-950/30 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 items-start gap-4">
                  <Avatar
                    src={avatar ?? undefined}
                    alt={displayName}
                    className="border border-rose-500/30 bg-rose-900/60"
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-white">{displayName}</p>
                      <Badge className="bg-rose-500/20 text-rose-50">@{user.username}</Badge>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-rose-100/75">
                      <span>{user.email}</span>
                      {user.phone ? <span>{user.phone}</span> : null}
                      <span>Joined {joined}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-rose-200/70">
                      {user.bloodGroup ? <Badge variant="secondary" className="bg-rose-500/20 text-rose-50">Blood: {user.bloodGroup}</Badge> : null}
                      {user.donorStatus ? (
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100">Donor: {user.donorStatus}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-100">No donor profile</Badge>
                      )}
                      <Badge variant="secondary" className="bg-rose-500/20 text-rose-50">Requests: {user.requestCount}</Badge>
                      <Badge variant="secondary" className="bg-rose-500/20 text-rose-50">Responses: {user.responseCount}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-400/40 text-rose-100 hover:bg-rose-500/20"
                    disabled={isPending && activeId === user.id}
                    onClick={() => handleRemove(user.id, user.username)}
                  >
                    {isPending && activeId === user.id ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-rose-500/20 text-rose-50 hover:bg-rose-500/30"
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
