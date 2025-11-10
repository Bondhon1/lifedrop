import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string | string[];
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam.at(0) ?? "" : tokenParam ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-semibold">Choose a new password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and unique to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
