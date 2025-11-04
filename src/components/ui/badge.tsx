import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
	{
		variants: {
			variant: {
				default: "bg-[var(--color-primary-start)] text-white",
				secondary: "bg-[var(--color-surface-primary-soft)] text-primary",
				outline: "border border-soft text-secondary",
				success: "bg-emerald-500/90 text-white",
				warning: "bg-amber-500 text-amber-900",
				danger: "bg-[var(--color-text-danger)] text-white",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
	<span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));

Badge.displayName = "Badge";

export { Badge, badgeVariants };
