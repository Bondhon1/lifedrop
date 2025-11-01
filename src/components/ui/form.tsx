"use client";

import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Form<TFieldValues extends FieldValues>({
  form,
  children,
  className,
  ...props
}: {
  form: UseFormReturn<TFieldValues>;
  children: ReactNode;
  className?: string;
} & React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <FormProvider {...form}>
      <form className={className} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export const FormLabel = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium text-primary", className)} {...props} />
);

export const FormMessage = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  if (!children) return null;
  return (
  <p className={cn("text-sm text-[var(--color-text-danger)]", className)} {...props}>
      {children}
    </p>
  );
};
