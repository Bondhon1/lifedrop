"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "react-hot-toast";

const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid admin email"),
  password: z.string().min(6, "Enter your password"),
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: AdminLoginValues) => {
    startTransition(async () => {
      const res = await signIn("admin-credentials", {
        ...values,
        redirect: false,
      });

      if (!res?.ok) {
        toast.error("Invalid admin credentials. Please try again.");
        return;
      }

      toast.success("Welcome back, admin.");
      window.location.href = "/admin/overview";
    });
  };

  return (
    <Card className="bg-white/95">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold text-[#2E2E2E]">Admin sign in</CardTitle>
        <p className="text-sm text-[#5F5F5F]">
          Access moderation tools, donor applications, and reports for the entire platform.
        </p>
      </CardHeader>
      <CardContent className="gap-5">
        <Form form={form} className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormItem>
            <FormLabel htmlFor="email">Admin email</FormLabel>
            <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
            <FormMessage>{form.formState.errors.email?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            <FormMessage>{form.formState.errors.password?.message}</FormMessage>
          </FormItem>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </Form>

        <p className="text-sm text-[#5F5F5F]">
          Are you a community member? {" "}
          <Link href="/login" className="font-semibold text-[#0072FF] underline-offset-4 hover:text-[#00C6FF] hover:underline">
            Switch to member login
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
