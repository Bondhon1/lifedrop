import nodemailer, { type Transporter } from "nodemailer";

export type SendMailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let cachedTransporter: Transporter | null | undefined;

function resolveTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secureValue = process.env.SMTP_SECURE;

  if (!host || !portValue || !user || !pass) {
    console.warn("Mailer disabled: missing SMTP configuration");
    cachedTransporter = null;
    return cachedTransporter;
  }

  const port = Number.parseInt(portValue, 10);
  const secure = secureValue ? secureValue === "true" : port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number.isNaN(port) ? 587 : port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendMail(params: SendMailParams): Promise<boolean> {
  const transporter = resolveTransporter();
  if (!transporter) {
    return false;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error("sendMail:error", error);
    return false;
  }
}
