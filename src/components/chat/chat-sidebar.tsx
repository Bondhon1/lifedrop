import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type ChatFriend = {
  id: number;
  username: string;
  name?: string | null;
  bloodGroup?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  isActive: boolean;
};

type ChatSidebarProps = {
  friends: ChatFriend[];
  onCloseMobile?: () => void;
};

export function ChatSidebar({ friends, onCloseMobile }: ChatSidebarProps) {
  if (friends.length === 0) {
    return (
      <aside className="flex h-full flex-col gap-4 rounded-3xl border border-soft bg-surface-card p-4 lg:border-0 lg:bg-transparent lg:p-0">
        <header className="flex items-center justify-between px-2 lg:mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Conversations</h2>
          </div>
          {onCloseMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseMobile}
              className="lg:hidden h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-3xl border border-soft bg-surface-card p-6 text-center text-sm text-secondary">
          <p>No conversations yet.</p>
          <p className="text-xs text-muted">Start a conversation by visiting any user profile and sending them a message.</p>
        </div>
      </aside>
    );
  }

  const totalUnread = friends.reduce((sum, friend) => sum + (friend.unreadCount ?? 0), 0);

  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-soft bg-surface-card p-4 lg:border-0 lg:bg-transparent lg:p-0">
      <header className="flex items-center justify-between px-2 lg:mt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">Conversations</h2>
          {totalUnread > 0 ? (
            <Badge className="bg-[var(--color-primary-start)] text-white">
              {Math.min(totalUnread, 99)}
            </Badge>
          ) : null}
        </div>
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            className="lg:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </header>
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 max-h-[calc(100vh-200px)] lg:max-h-none">
        {friends.map((friend) => (
          <Link
            key={friend.id}
            href={`/chat?user=${friend.id}`}
            onClick={onCloseMobile}
            className={cn(
              "block w-full rounded-2xl border border-transparent bg-surface-card-muted px-4 py-3 text-left transition hover:border-[var(--color-border-primary)] hover:bg-surface-primary-soft",
              friend.isActive ? "border-[var(--color-border-primary)] bg-surface-primary-strong text-primary" : "text-secondary",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">{friend.name ?? friend.username}</p>
                {friend.bloodGroup ? <p className="text-xs text-muted">{friend.bloodGroup}</p> : null}
              </div>
              {friend.unreadCount > 0 ? (
                <Badge className="ml-2 bg-[var(--color-primary-start)] text-white">
                  {Math.min(friend.unreadCount, 99)}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-muted">
              {friend.lastMessage ? friend.lastMessage : "No messages yet."}
            </p>
            {friend.lastMessageAt ? (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">{friend.lastMessageAt}</p>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
