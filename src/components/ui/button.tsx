import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--color-primary-start)] text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--color-primary-end)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "",
        secondary: "focus-visible:ring-[var(--ring-secondary)]",
        ghost: "",
        outline: "border border-[var(--color-primary-end)]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-10 px-6",
        lg: "h-12 px-7 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
