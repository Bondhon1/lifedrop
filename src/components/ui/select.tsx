import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-rose-500/40 bg-rose-950/80 px-4 text-sm text-rose-50 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/50 disabled:cursor-not-allowed disabled:opacity-60",
        "[color-scheme:dark]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
