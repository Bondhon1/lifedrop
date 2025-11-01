import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-soft bg-surface-overlay px-4 py-3 text-sm text-primary placeholder:text-[var(--color-text-tertiary)] transition focus:border-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
