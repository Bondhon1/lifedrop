import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your Lifedrop account",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h1 style="margin: 0 0 20px; color: #dc2626; font-size: 28px; font-weight: 600;">
                        Welcome to Lifedrop!
                      </h1>
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Thank you for registering. To complete your registration and start saving lives, please verify your email address by clicking the button below.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                        <tr>
                          <td style="border-radius: 6px; background-color: #dc2626;">
                            <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                      <p style="margin: 30px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        This verification link will expire in 24 hours. If you didn't create an account with Lifedrop, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        © ${new Date().getFullYear()} Lifedrop. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Welcome to Lifedrop!

Thank you for registering. To complete your registration, please verify your email address by visiting:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Lifedrop, you can safely ignore this email.

© ${new Date().getFullYear()} Lifedrop. All rights reserved.`,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your Lifedrop password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h1 style="margin: 0 0 20px; color: #dc2626; font-size: 28px; font-weight: 600;">
                        Reset Your Password
                      </h1>
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your Lifedrop password. Click the button below to create a new password.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                        <tr>
                          <td style="border-radius: 6px; background-color: #dc2626;">
                            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      <p style="margin: 30px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        © ${new Date().getFullYear()} Lifedrop. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Reset Your Password

We received a request to reset your Lifedrop password. Visit the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Lifedrop. All rights reserved.`,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendDonorAcceptanceEmail(
  recipientEmail: string,
  recipientName: string,
  patientName: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string | null,
  requestId: number
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const requestUrl = `${baseUrl}/requests/${requestId}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipientEmail,
    subject: `Blood Donation Match Confirmed - ${patientName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Donation Match Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px;">
                      <h1 style="margin: 0 0 20px; color: #dc2626; font-size: 28px; font-weight: 600;">
                        🎉 Donation Match Confirmed!
                      </h1>
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Dear ${recipientName},
                      </p>
                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Great news! A match has been confirmed for the blood donation request for <strong>${patientName}</strong>.
                      </p>
                      
                      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <h2 style="margin: 0 0 12px; color: #dc2626; font-size: 18px; font-weight: 600;">
                          Contact Information
                        </h2>
                        <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                          <strong>Name:</strong> ${contactName}
                        </p>
                        <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                          <strong>Email:</strong> <a href="mailto:${contactEmail}" style="color: #dc2626; text-decoration: none;">${contactEmail}</a>
                        </p>
                        ${contactPhone ? `<p style="margin: 0; color: #4b5563; font-size: 14px;">
                          <strong>Phone:</strong> <a href="tel:${contactPhone}" style="color: #dc2626; text-decoration: none;">${contactPhone}</a>
                        </p>` : ''}
                      </div>

                      <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Please coordinate with each other to arrange the donation. Time is critical, so please reach out as soon as possible.
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                        <tr>
                          <td style="border-radius: 6px; background-color: #dc2626;">
                            <a href="${requestUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                              View Request Details
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        Thank you for being part of the Lifedrop community and helping save lives!
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        © ${new Date().getFullYear()} Lifedrop. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Donation Match Confirmed!

Dear ${recipientName},

Great news! A match has been confirmed for the blood donation request for ${patientName}.

Contact Information:
- Name: ${contactName}
- Email: ${contactEmail}
${contactPhone ? `- Phone: ${contactPhone}` : ''}

Please coordinate with each other to arrange the donation. Time is critical, so please reach out as soon as possible.

View request details: ${requestUrl}

Thank you for being part of the Lifedrop community and helping save lives!

© ${new Date().getFullYear()} Lifedrop. All rights reserved.`,
  };

  await transporter.sendMail(mailOptions);
}
