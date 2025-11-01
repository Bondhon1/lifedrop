"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { createPasswordReset } from "@/server/actions/auth";
import { toast } from "react-hot-toast";

const schema = z.object({ email: z.string().email("Enter a valid email") });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createPasswordReset(values.email);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("If that account exists, we emailed reset instructions.");
      form.reset();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-semibold">Reset password</CardTitle>
        <CardDescription>
          Enter the email associated with your account and we&apos;ll send a secure reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        <Form form={form} className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormItem>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            <FormMessage>{form.formState.errors.email?.message}</FormMessage>
          </FormItem>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Sending…" : "Send reset link"}
          </Button>
        </Form>

        <Alert
          title="Remembered your password?"
          description={<Link href="/login" className="font-semibold text-accent underline">Return to sign in</Link>}
        />
      </CardContent>
    </Card>
  );
}
