import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-soft bg-surface-overlay px-4 text-sm text-primary placeholder:text-[var(--color-text-tertiary)] transition focus:border-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
