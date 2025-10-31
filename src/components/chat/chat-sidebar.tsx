import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
};

export function ChatSidebar({ friends }: ChatSidebarProps) {
  if (friends.length === 0) {
    return (
      <aside className="flex h-full flex-col gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/70 p-6 text-center text-sm text-rose-100/80">
        <p>No confirmed connections yet.</p>
        <p className="text-xs text-rose-100/60">Send friend requests from donor profiles to start conversations.</p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-rose-500/20 bg-rose-950/70 p-4">
      <header className="px-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-100/80">Conversations</h2>
      </header>
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {friends.map((friend) => (
          <Link
            key={friend.id}
            href={`/chat?user=${friend.id}`}
            className={cn(
              "block w-full rounded-2xl border border-transparent bg-rose-500/15 px-4 py-3 text-left transition hover:border-rose-400/40 hover:bg-rose-500/25",
              friend.isActive ? "border-rose-400/60 bg-rose-500/30 text-white" : "text-rose-100/80",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{friend.name ?? friend.username}</p>
                {friend.bloodGroup ? (
                  <p className="text-xs text-rose-100/70">{friend.bloodGroup}</p>
                ) : null}
              </div>
              {friend.unreadCount > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {Math.min(friend.unreadCount, 99)}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-rose-100/70">
              {friend.lastMessage ? friend.lastMessage : "No messages yet."}
            </p>
            {friend.lastMessageAt ? (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-rose-100/50">{friend.lastMessageAt}</p>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
