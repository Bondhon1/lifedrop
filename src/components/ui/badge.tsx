import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-primary-soft text-[var(--color-text-danger)] border border-primary",
    secondary: "bg-surface-secondary-soft text-[var(--color-text-accent-strong)] border border-secondary",
    success: "bg-success-soft text-success border border-success",
    warning: "bg-warning-soft text-warning border border-warning",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning";
}
