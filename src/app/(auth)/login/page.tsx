"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { toast } from "react-hot-toast";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/dashboard";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: LoginValues) => {
    startTransition(async () => {
      const res = await signIn("user-credentials", {
        ...values,
        redirect: false,
        callbackUrl,
      });

      if (!res?.ok) {
        toast.error("Invalid credentials. Please try again.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  };

  return (
    <Card className="bg-slate-950/90">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold text-white">Welcome back</CardTitle>
        <p className="text-sm text-slate-300">
          Sign in to manage blood requests, chat with donors, and stay ahead of urgent needs.
        </p>
      </CardHeader>
      <CardContent className="gap-5">
        <Form form={form} className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormItem>
            <FormLabel htmlFor="emailOrUsername">Email or Username</FormLabel>
            <Input id="emailOrUsername" autoComplete="username" {...form.register("emailOrUsername")} />
            <FormMessage>{form.formState.errors.emailOrUsername?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            <FormMessage>{form.formState.errors.password?.message}</FormMessage>
          </FormItem>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <Link href="/forgot-password" className="font-medium text-rose-200 hover:text-white">
              Forgot password?
            </Link>
          </div>

          <div className="grid gap-3">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="w-full border-slate-700/60 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </Button>
          </div>
        </Form>

        <Alert
          variant="default"
          title="New here?"
          description={
            <span>
              Create an account in minutes. <Link href="/register" className="font-semibold text-white underline">Join now</Link>.
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
