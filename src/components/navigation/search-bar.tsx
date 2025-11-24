"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, MessageCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UserHit = { id: number; username: string; name?: string | null; profilePicture?: string | null; donorApplication?: { status?: string | null } };
type RequestHit = { id: number; patientName: string; hospitalName?: string | null; bloodGroup?: string | null; user?: { username?: string | null; name?: string | null } };

type SearchBarProps = {
  compact?: boolean;
};

export default function SearchBar({ compact = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ users: UserHit[]; requests: RequestHit[] }>({ users: [], requests: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!query) {
      setResults({ users: [], requests: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ac.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
        setLoading(false);
      } catch (err) {
        if ((err as any).name === 'AbortError') return;
        setLoading(false);
        console.error(err);
      }
    }, 300);
  }, [query]);

  const onClear = () => {
    setQuery("");
    setResults({ users: [], requests: [] });
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Desktop input */}
      <div className={compact ? "hidden" : "hidden lg:block"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder="Search members or requests"
            className="w-[28rem] rounded-full border border-soft bg-surface-card px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring-primary)]"
          />
          {query && (
            <button onClick={onClear} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results popup */}
        {open && (results.users.length > 0 || results.requests.length > 0 || loading) && (
          <div className="absolute left-0 z-50 mt-2 w-[28rem] rounded-xl border border-soft bg-surface-card p-2 shadow-soft">
            {loading ? (
              <div className="p-4 text-sm text-secondary">Searching…</div>
            ) : (
              <div className="grid gap-2">
                {results.users.length > 0 && (
                  <div>
                    <div className="px-3 pb-1 text-xs font-semibold text-muted">Members</div>
                    {results.users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-primary-soft rounded-md">
                        <Link href={`/members/${u.username}`} className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-card-muted flex-shrink-0">
                            {u.profilePicture ? <Image src={u.profilePicture} alt={u.name ?? u.username} width={32} height={32} className="object-cover" /> : null}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-primary truncate">{u.name ?? u.username}</div>
                              {u.donorApplication?.status === 'Approved' ? (
                                <Badge variant="success" className="whitespace-nowrap">Verified Donor</Badge>
                              ) : null}
                            </div>
                            <div className="text-xs text-secondary truncate">@{u.username}</div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/chat?user=${u.id}`} aria-label={`Chat with ${u.username}`}>
                              <MessageCircle className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.requests.length > 0 && (
                  <div>
                    <div className="px-3 pb-1 text-xs font-semibold text-muted">Requests</div>
                    {results.requests.map((r) => (
                      <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-primary-soft rounded-md">
                        <div className="h-8 w-8 flex-shrink-0 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-semibold">{r.bloodGroup ?? 'B'}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-primary truncate">{r.patientName}</div>
                          <div className="text-xs text-secondary truncate">{r.hospitalName ?? ''} • {r.user?.name ?? r.user?.username ?? ''}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.users.length === 0 && results.requests.length === 0 && (
                  <div className="p-4 text-sm text-secondary">No results found.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile icon that opens modal (or icon-only when `compact`) */}
      <div className={compact ? "block" : "lg:hidden"}>
        <button
          aria-label="Open search"
          className="rounded-full p-1 text-secondary"
          onClick={() => {
            setOpen(true);
            // focus handled by modal input when it mounts
          }}
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card p-4 shadow-lg lg:max-w-xl">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-secondary" />
              <input
                autoFocus
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members or requests"
                className="w-full rounded-full border border-soft bg-transparent px-4 py-2 text-sm outline-none"
              />
              <button onClick={() => { setOpen(false); setQuery(''); }} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-secondary">Searching…</div>
              ) : (
                <div className="grid gap-2">
                  {results.users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-3 px-2 py-2 hover:bg-surface-primary-soft rounded-md">
                      <Link href={`/members/${u.username}`} className="flex items-center gap-3" onClick={() => setOpen(false)}>
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-card-muted">
                          {u.profilePicture ? <Image src={u.profilePicture} alt={u.name ?? u.username} width={32} height={32} className="object-cover" /> : null}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-primary">{u.name ?? u.username}</div>
                            {u.donorApplication?.status === 'Approved' ? (
                              <Badge variant="success" className="whitespace-nowrap">Verified Donor</Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-secondary">@{u.username}</div>
                        </div>
                      </Link>
                      <div>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/chat?user=${u.id}`} aria-label={`Chat with ${u.username}`}>
                            <MessageCircle className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {results.requests.map((r) => (
                    <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center gap-3 px-2 py-2 hover:bg-surface-primary-soft rounded-md" onClick={() => setOpen(false)}>
                      <div className="h-8 w-8 flex-shrink-0 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-semibold">{r.bloodGroup ?? 'B'}</div>
                      <div>
                        <div className="text-sm font-semibold text-primary">{r.patientName}</div>
                        <div className="text-xs text-secondary">{r.hospitalName ?? ''} • {r.user?.name ?? r.user?.username ?? ''}</div>
                      </div>
                    </Link>
                  ))}

                  {results.users.length === 0 && results.requests.length === 0 && (
                    <div className="p-4 text-sm text-secondary">No results found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
