"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/feed";
  const [showResendLink, setShowResendLink] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

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
      // First, check if user exists and if email is verified
      try {
        const checkResponse = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrUsername: values.emailOrUsername }),
        });

        const checkData = await checkResponse.json();

        if (!checkResponse.ok) {
          toast.error(checkData.error || "Failed to verify account status");
          return;
        }

        if (checkData.exists && !checkData.emailVerified) {
          toast.error("Please verify your email before logging in. Check your inbox for the verification link.");
          setShowResendLink(true);
          setEmailForResend(checkData.email);
          return;
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }

      // Proceed with login
      const res = await signIn("user-credentials", {
        ...values,
        redirect: false,
        callbackUrl,
      });

      if (!res?.ok) {
        if (res?.error === "CredentialsSignin") {
          toast.error("Invalid email/username or password. Please try again.");
        } else if (res?.error) {
          toast.error(res.error);
        } else {
          toast.error("Invalid credentials. Please try again.");
        }
        return;
      }

      toast.success("Login successful!");
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
    <div className="rounded-3xl border border-soft bg-surface-card p-8 shadow-soft">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Welcome back</h1>
        <p className="mt-2 text-secondary">
          Sign in to manage blood requests, chat with donors, and stay ahead of urgent needs.
        </p>
      </div>
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

          <div className="flex items-center justify-between text-sm text-secondary">
            <Link href="/forgot-password" className="font-semibold text-accent hover:text-accent">
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
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </Button>
          </div>
        </Form>

        {showResendLink && emailForResend && (
          <Alert
            variant="danger"
            title="Email not verified"
            description={
              <span>
                Your email is not verified yet.{" "}
                <Link href={`/verify-email?email=${encodeURIComponent(emailForResend)}`} className="font-semibold underline">
                  Resend verification email
                </Link>
              </span>
            }
          />
        )}

        <Alert
          variant="default"
          title="New here?"
          description={
            <span>
              Create an account in minutes. <Link href="/register" className="font-semibold text-accent underline">Join now</Link>.
            </span>
          }
        />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
