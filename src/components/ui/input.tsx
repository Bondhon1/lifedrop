import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
	<input
		ref={ref}
		type={type}
		className={cn(
			"flex h-11 w-full rounded-xl border border-soft bg-surface-overlay px-4 text-sm text-primary shadow-sm transition focus:border-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";

export { Input };
