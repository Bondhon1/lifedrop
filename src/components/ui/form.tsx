import * as React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { FormProvider } from "react-hook-form";

import { cn } from "@/lib/utils";

type FormProps<TFieldValues extends FieldValues = FieldValues> = React.FormHTMLAttributes<HTMLFormElement> & {
	form: UseFormReturn<TFieldValues>;
};

const Form = <TFieldValues extends FieldValues>({ form, className, children, ...props }: FormProps<TFieldValues>) => (
	<FormProvider {...form}>
		<form className={className} {...props}>
			{children}
		</form>
	</FormProvider>
);

type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("grid gap-2", className)} {...props} />
));
FormItem.displayName = "FormItem";

type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(({ className, ...props }, ref) => (
	<label ref={ref} className={cn("text-sm font-medium text-secondary", className)} {...props} />
));
FormLabel.displayName = "FormLabel";

type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(({ className, children, ...props }, ref) => {
	if (!children) {
		return null;
	}
	return (
		<p ref={ref} className={cn("text-xs text-[var(--color-text-danger)]", className)} {...props}>
			{children}
		</p>
	);
});
FormMessage.displayName = "FormMessage";

export { Form, FormItem, FormLabel, FormMessage };
