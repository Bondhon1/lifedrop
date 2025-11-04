import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring-primary)] disabled:pointer-events-none disabled:opacity-60",
	{
		variants: {
			variant: {
				primary: "bg-[var(--color-primary-start)] text-white shadow-soft hover:bg-[var(--color-primary-end)]",
				default: "bg-[var(--color-primary-start)] text-white shadow-soft hover:bg-[var(--color-primary-end)]",
				secondary: "bg-surface-card-muted text-primary hover:bg-surface-primary-soft",
				outline: "border border-soft bg-transparent text-primary hover:bg-surface-primary-soft",
				ghost: "bg-transparent text-secondary hover:bg-surface-primary-soft",
				danger: "bg-[var(--color-text-danger)] text-white hover:bg-[var(--color-text-danger-strong)]",
				link: "bg-transparent p-0 text-[var(--color-primary-start)] underline-offset-4 hover:underline",
			},
			size: {
				default: "h-11 px-6",
				sm: "h-9 px-4 text-sm",
				lg: "h-12 px-7 text-base",
				icon: "h-11 w-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
