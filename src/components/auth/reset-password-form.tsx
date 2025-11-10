"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { updatePasswordWithToken } from "@/server/actions/password";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be 64 characters or less"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    setFeedback(null);

    if (!token) {
      setFeedback("This reset link is missing a token. Request a new one and try again.");
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordWithToken({
        token,
        password: values.password,
      });

      if (!result.ok) {
        setFeedback(result.message);
        toast.error(result.message);
        return;
      }

      toast.success("Password updated. You can sign in with your new password now.");
      router.replace("/login");
    });
  };

  return (
    <Form form={form} className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormItem>
        <FormLabel htmlFor="password">New password</FormLabel>
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        <FormMessage>{form.formState.errors.password?.message}</FormMessage>
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        <FormMessage>{form.formState.errors.confirmPassword?.message}</FormMessage>
      </FormItem>

      {feedback ? <p className="text-sm text-danger">{feedback}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </Form>
  );
}
