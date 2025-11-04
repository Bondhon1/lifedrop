import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, rows = 4, ...props }, ref) => (
	<textarea
		ref={ref}
		rows={rows}
		className={cn(
			"w-full rounded-xl border border-soft bg-surface-overlay px-4 py-3 text-sm text-primary shadow-sm transition focus:border-[var(--color-primary-end)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
));

Textarea.displayName = "Textarea";

export { Textarea };
