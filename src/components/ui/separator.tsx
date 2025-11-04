import * as React from "react";

import { cn } from "@/lib/utils";

export type SeparatorProps = React.HTMLAttributes<HTMLHRElement>;

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(({ className, ...props }, ref) => (
	<hr ref={ref} className={cn("my-2 h-px w-full border-none bg-soft", className)} {...props} />
));

Separator.displayName = "Separator";

export { Separator };
