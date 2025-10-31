import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
  default: "bg-rose-500/20 text-rose-100 border border-rose-500/40",
  secondary: "bg-rose-500/10 text-rose-50 border border-rose-500/25",
    success: "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40",
    warning: "bg-amber-500/20 text-amber-100 border border-amber-500/40",
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
