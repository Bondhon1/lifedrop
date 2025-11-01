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
    default: "border-soft bg-surface-primary-soft text-primary",
    success: "border-success bg-success-soft text-success",
    destructive: "border-danger bg-danger-soft text-[var(--color-text-danger)]",
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
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</p>
        {description ? <div className="text-sm leading-relaxed text-secondary">{description}</div> : null}
      </div>
      {actions}
    </div>
  );
}
