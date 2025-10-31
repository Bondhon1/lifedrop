import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Alert({
  title,
  description,
  variant = "default",
  className,
  actions,
}: {
  title: string;
  description?: ReactNode;
  variant?: "default" | "success" | "destructive";
  className?: string;
  actions?: ReactNode;
}) {
  const variantStyles = {
    default: "border-rose-500/25 bg-rose-500/10 text-rose-50",
    success: "border-emerald-500/40 bg-emerald-500/20 text-emerald-100",
    destructive: "border-rose-500/40 bg-rose-500/25 text-rose-100",
  } as const;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border px-5 py-4",
        variantStyles[variant],
        className,
      )}
    >
      <div className="grid gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide">{title}</p>
        {description ? <div className="text-sm leading-relaxed text-white/80">{description}</div> : null}
      </div>
      {actions}
    </div>
  );
}
