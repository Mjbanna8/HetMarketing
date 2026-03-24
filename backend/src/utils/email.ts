import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const sendPromise = transporter.sendMail({
      from: `"WA Commerce" <${config.smtp.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // 10-second timeout to prevent API hanging if SMTP is blocked/slow
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000);
    });

    await Promise.race([sendPromise, timeoutPromise]);
    
    logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
  } catch (error) {
    logger.error({ error, to: options.to }, 'Failed to send email');
    throw new Error('Failed to send email: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export function buildResetPasswordEmail(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f5; padding: 24px; }
        .container { background: #fff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 32px; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { color: #71717a; font-size: 13px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #18181b;">Reset Your Password</h2>
        <p style="color: #3f3f46;">We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </p>
        <p class="footer">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    </body>
    </html>
  `;
}
