"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { sendChatMessage, markConversationRead } from "@/server/actions/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/components/providers/socket-provider";

export type ChatPartner = {
  id: number;
  username: string;
  name?: string | null;
  bloodGroup?: string | null;
};

export type ChatMessageView = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
  optimistic?: boolean;
};

export type ChatConversationProps = {
  currentUserId: number;
  partner: ChatPartner | null;
  messages: ChatMessageView[];
};

export function ChatConversation({ currentUserId, partner, messages }: ChatConversationProps) {
  const [thread, setThread] = useState(messages);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socket = useSocket();
  const markReadInFlight = useRef(false);
  const pendingOptimisticIds = useRef<number[]>([]);

  useEffect(() => {
    setThread(messages);
    pendingOptimisticIds.current = [];
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  if (!partner) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-3xl border border-soft bg-surface-card text-center text-sm text-secondary">
        <p>Select a conversation to start chatting.</p>
      </section>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (message.length === 0) {
      toast.error("Type a message to send.");
      return;
    }

    const temporaryId = Date.now();
    const optimisticMessage: ChatMessageView = {
      id: temporaryId,
      content: message,
      createdAt: new Date().toISOString(),
      senderId: currentUserId,
      isRead: true,
      optimistic: true,
    };

    setThread((prev) => [...prev, optimisticMessage]);
    setText("");
    pendingOptimisticIds.current.push(temporaryId);

    const formData = new FormData();
    formData.set("receiverId", String(partner.id));
    formData.set("text", message);

    startTransition(async () => {
      const result = await sendChatMessage(formData);
      if (!result.ok) {
        toast.error(result.message);
        setThread((prev) => prev.filter((msg) => msg.id !== temporaryId));
        setText(message);
        pendingOptimisticIds.current = pendingOptimisticIds.current.filter((id) => id !== temporaryId);
        return;
      }

      setThread((prev) =>
        prev.map((msg) =>
          msg.id === temporaryId
            ? {
                ...msg,
                id: result.data.id,
                optimistic: false,
              }
            : msg,
        ),
      );
      pendingOptimisticIds.current = pendingOptimisticIds.current.filter((id) => id !== temporaryId);
    });
  };

  useEffect(() => {
    if (!socket || !partner) {
      return;
    }

    const handleNewMessage = (payload: {
      id: number;
      content: string;
      createdAt: string;
      senderId: number;
      receiverId: number;
    }) => {
      if (!payload) {
        return;
      }

      const isConversationMessage =
        (payload.senderId === partner.id && payload.receiverId === currentUserId) ||
        (payload.senderId === currentUserId && payload.receiverId === partner.id);

      if (!isConversationMessage) {
        return;
      }

      let optimisticIdToReplace: number | undefined;
      if (payload.senderId === currentUserId && pendingOptimisticIds.current.length > 0) {
        optimisticIdToReplace = pendingOptimisticIds.current.shift();
      }

      setThread((prev) => {
        const nextMessage: ChatMessageView = {
          id: payload.id,
          content: payload.content,
          createdAt: payload.createdAt,
          senderId: payload.senderId,
          isRead: payload.senderId === currentUserId,
          optimistic: false,
        };

        if (typeof optimisticIdToReplace === "number") {
          const hasOptimistic = prev.some((msg) => msg.id === optimisticIdToReplace);
          if (hasOptimistic) {
            const replaced = prev.map((msg) =>
              msg.id === optimisticIdToReplace
                ? {
                    ...nextMessage,
                    optimistic: false,
                  }
                : msg,
            );

            replaced.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return replaced;
          }
        }

        const existsById = prev.some((msg) => msg.id === payload.id);

        if (existsById) {
          return prev.map((msg) =>
            msg.id === payload.id
              ? {
                  ...msg,
                  ...nextMessage,
                  optimistic: false,
                }
              : msg,
          );
        }

        const merged = [...prev, nextMessage];
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return merged;
      });
    };

    socket.on("chat:new-message", handleNewMessage);

    return () => {
      socket.off("chat:new-message", handleNewMessage);
    };
  }, [socket, partner, currentUserId]);

  useEffect(() => {
    if (!partner) {
      return;
    }

    const hasUnreadFromPartner = thread.some((message) => message.senderId === partner.id && !message.isRead);
    if (!hasUnreadFromPartner || markReadInFlight.current) {
      return;
    }

    markReadInFlight.current = true;
    markConversationRead(partner.id)
      .then((result) => {
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        setThread((prev) =>
          prev.map((message) =>
            message.senderId === partner.id
              ? {
                  ...message,
                  isRead: true,
                }
              : message,
          ),
        );
      })
      .catch((error) => {
        console.error("markConversationRead:error", error);
        toast.error("Unable to mark messages as read.");
      })
      .finally(() => {
        markReadInFlight.current = false;
      });
  }, [partner, thread]);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-soft bg-surface-card">
      <header className="flex items-center justify-between gap-3 border-b border-soft px-4 py-2 lg:flex-nowrap lg:h-auto h-10 lg:px-6 lg:py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-primary lg:text-lg">{partner.name ?? partner.username}</h2>
          {partner.bloodGroup ? <p className="text-xs text-secondary lg:text-sm lg:block hidden">Blood group: {partner.bloodGroup}</p> : null}
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {thread.length === 0 ? (
          <p className="text-sm text-secondary">Start the conversation with a quick hello.</p>
        ) : (
          thread.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            const relativeTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

            return (
              <div key={message.id} className="flex flex-col gap-1">
                <div
                  className={
                    isOwnMessage
                      ? `ml-auto max-w-[70%] rounded-2xl bg-[var(--color-primary-start)] px-4 py-3 text-sm text-white shadow-soft ${
                          message.optimistic ? "opacity-70" : ""
                        }`
                      : "mr-auto max-w-[70%] rounded-2xl border border-soft bg-surface-card-muted px-4 py-3 text-sm text-secondary"
                  }
                >
                  {message.content}
                </div>
                <span className={`text-xs ${isOwnMessage ? "ml-auto text-muted" : "text-muted"}`}>
                  {relativeTime}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 border-t border-soft px-6 py-4">
        <Textarea
          placeholder="Write a message…"
          value={text}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
          disabled={isPending}
          className="min-h-[80px] resize-y"
        />
        <div className="flex items-center justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </section>
  );
}
