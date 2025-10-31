"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { MessageCircle, SendHorizontal, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createComment, type CommentViewModel, toggleCommentLike } from "@/server/actions/comment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type CommentThreadProps = {
  requestId: number;
  comments: CommentViewModel[];
};

const formatRelativeTime = (iso: string) => {
  if (!iso) return "Just now";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch (error) {
    console.error("CommentThread:formatRelativeTime", error);
    return "Just now";
  }
};

export function CommentThread({ requestId, comments }: CommentThreadProps) {
  const [thread, setThread] = useState<CommentViewModel[]>(comments);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = commentText.trim();
    if (message.length === 0) {
      toast.error("Please enter a comment before submitting.");
      return;
    }

    const formData = new FormData();
    formData.set("requestId", String(requestId));
    formData.set("text", message);

    startTransition(async () => {
      const result = await createComment(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setThread((prev) => [result.data, ...prev]);
      setCommentText("");
      router.refresh();
    });
  };

  const handleToggleLike = (commentId: number) => {
    setThread((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              likedByViewer: !comment.likedByViewer,
              likeCount: comment.likedByViewer ? Math.max(0, comment.likeCount - 1) : comment.likeCount + 1,
            }
          : comment,
      ),
    );

    startTransition(async () => {
      const result = await toggleCommentLike(commentId);
      if (!result.ok) {
        toast.error(result.message);
        setThread((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likedByViewer: !comment.likedByViewer,
                  likeCount: comment.likedByViewer ? Math.max(0, comment.likeCount - 1) : comment.likeCount + 1,
                }
              : comment,
          ),
        );
        return;
      }

      setThread((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, likedByViewer: result.data.liked, likeCount: result.data.likeCount }
            : comment,
        ),
      );
    });
  };

  return (
    <div className="grid gap-4">
      <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/60 p-4 shadow-lg shadow-rose-900/30">
        <label htmlFor="comment" className="flex items-center gap-2 text-sm font-semibold text-white">
          <MessageCircle className="h-4 w-4" /> Add a comment
        </label>
        <Textarea
          id="comment"
          name="text"
          placeholder="Offer support, coordinate donors, or share an update."
          className="min-h-[120px] resize-y"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          disabled={isPending}
        />
        <div className="flex items-center justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            <SendHorizontal className="mr-2 h-4 w-4" />
            {isPending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      <div className="grid gap-3">
        {thread.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-100/80">
            No comments yet. Be the first to share an update.
          </p>
        ) : (
          thread.map((comment) => (
            <article
              key={comment.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/70 p-4 shadow-lg shadow-rose-900/30",
                comment.likedByViewer ? "border-rose-400/40" : "",
              )}
            >
              <header className="flex items-center justify-between text-sm text-rose-100/80">
                <div>
                  <Link
                    href={`/members/${comment.author.username}`}
                    className="font-semibold text-white underline-offset-2 hover:text-rose-100 hover:underline"
                  >
                    {comment.author.name ?? comment.author.username}
                  </Link>
                  <p className="text-xs text-rose-100/60">{formatRelativeTime(comment.createdAt)}</p>
                </div>
                {comment.author.bloodGroup ? (
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-100/80">
                    {comment.author.bloodGroup}
                  </span>
                ) : null}
              </header>
              <p className="whitespace-pre-line text-sm text-rose-50/95">{comment.text}</p>
              <footer className="flex items-center justify-between text-xs text-rose-100/70">
                <button
                  type="button"
                  onClick={() => handleToggleLike(comment.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-rose-100/80 transition hover:bg-rose-500/25"
                  disabled={isPending}
                >
                  <ThumbsUp className={cn("h-3.5 w-3.5", comment.likedByViewer ? "text-rose-300" : "")} />
                  {comment.likeCount}
                </button>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
