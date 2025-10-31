import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { buildAbsoluteUrl } from "@/lib/storage";
import { sendMail } from "./mailer";

const EXPIRATION_MINUTES = 60;

type VerificationParams = {
  email: string;
  name?: string | null;
  username?: string | null;
};

function renderVerificationEmailContent(verifyUrl: string, displayName: string) {
  const text = `Hi ${displayName},\n\nThanks for joining Lifedrop. Confirm your email by visiting the link below:\n${verifyUrl}\n\nThis link expires in ${EXPIRATION_MINUTES} minutes.\n\nIf you did not create this account, you can ignore this email.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Verify your email</title></head><body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 24px;"><table role="presentation" style="width: 100%; max-width: 480px; margin: 0 auto; background-color: #111827; border-radius: 12px; padding: 32px;"><tr><td style="text-align: center;"><h1 style="margin: 0 0 16px; font-size: 22px; color: #fbbf24;">Confirm your email</h1><p style="margin: 0 0 24px; line-height: 1.5;">Hi ${displayName}, thanks for joining Lifedrop. Click the button below within ${EXPIRATION_MINUTES} minutes to verify your email address.</p><p style="margin: 0 0 32px;"><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: #f9fafb; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify email</a></p><p style="margin: 0; font-size: 14px; color: #94a3b8;">If the button does not work, copy and paste this URL into your browser:</p><p style="margin: 8px 0 0; font-size: 13px; word-break: break-all; color: #f8fafc;">${verifyUrl}</p></td></tr></table></body></html>`;

  return { text, html };
}

export async function issueEmailVerification(params: VerificationParams): Promise<{ verifyUrl: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email address is required for verification");
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  const verifyUrl = buildAbsoluteUrl(`/verify-email?token=${token}`);
  const displayName = params.name?.trim() || params.username?.trim() || normalizedEmail;
  const { text, html } = renderVerificationEmailContent(verifyUrl, displayName);

  const sent = await sendMail({
    to: normalizedEmail,
  subject: "Verify your Lifedrop email",
    text,
    html,
  });

  if (!sent) {
    throw new Error("Verification email delivery failed");
  }

  return { verifyUrl };
}
