"use client";

import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema } from "@/lib/validators/user";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { registerUser } from "@/server/actions/auth";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const form = useForm<z.infer<typeof registerUserSchema>>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
    },
  });

  const [isPending, startTransition] = useTransition();
  const callbackUrl = "/feed";

  const onSubmit = (values: z.infer<typeof registerUserSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    startTransition(async () => {
      const result = await registerUser(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Account created! Check your email to verify your account.");
      form.reset();
    });
  };

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-semibold">Create your account</CardTitle>
        <CardDescription>
          Join a thriving community of donors and coordinators making blood availability transparent.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        <Form form={form} className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormItem>
            <FormLabel htmlFor="username">Username</FormLabel>
            <Input id="username" placeholder="johndoe" autoComplete="username" {...form.register("username")} />
            <FormMessage>{form.formState.errors.username?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...form.register("email")} />
            <FormMessage>{form.formState.errors.email?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            <FormMessage>{form.formState.errors.password?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="name">Display name (optional)</FormLabel>
            <Input id="name" placeholder="John Doe" autoComplete="name" {...form.register("name")} />
            <FormMessage>{form.formState.errors.name?.message}</FormMessage>
          </FormItem>

          <div className="grid gap-3">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating account..." : "Create account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="w-full"
              onClick={handleGoogleSignUp}
            >
              Continue with Google
            </Button>
          </div>
        </Form>

        <Alert
          variant="default"
          title="Already verified donor?"
          description={
            <span>
              If you already have an account, <Link href="/login" className="font-semibold text-accent underline">sign in here</Link>.
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}
