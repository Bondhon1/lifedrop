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
        "h-11 w-full appearance-none rounded-xl border border-soft bg-surface-overlay px-4 text-sm text-primary focus:border-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
