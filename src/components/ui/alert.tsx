import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-2xl border p-5 shadow-soft", {
	variants: {
		variant: {
			default: "border-soft bg-surface-card text-primary",
			info: "border-sky-400/30 bg-sky-950/60 text-sky-50",
			success: "border-emerald-500/30 bg-emerald-950/60 text-emerald-50",
			warning: "border-amber-400/40 bg-amber-950/70 text-amber-50",
			danger: "border-rose-500/30 bg-rose-950/70 text-rose-50",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

type AlertProps = React.HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof alertVariants> & {
		title?: React.ReactNode;
		description?: React.ReactNode;
	};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant, title, description, children, ...props }, ref) => (
		<div ref={ref} className={cn(alertVariants({ variant }), className)} role="status" {...props}>
			{title ? <h3 className="text-base font-semibold leading-tight">{title}</h3> : null}
			{description ? <p className="mt-2 text-sm text-inherit/80">{description}</p> : null}
			{children}
		</div>
	),
);

Alert.displayName = "Alert";

export { Alert, alertVariants };
