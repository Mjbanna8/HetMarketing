import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BadRequestError, ConflictError } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { sendEmail } from '../utils/email.js';
import type {
  RegisterOtpResendInput,
  RegisterOtpSendInput,
  RegisterOtpVerifyInput,
} from '../utils/validators.js';

const OTP_EXPIRY_MINUTES = 10;

interface OtpResponse {
  message: string;
  whatsappLink: string | null;
}

interface CreatedUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizeMobile(mobile: string): string {
  return mobile.trim();
}

function buildWhatsAppLink(mobile: string, otp: string): string | null {
  const phone = mobile.replace(/\D/g, '');
  if (!phone) {
    return null;
  }

  const text = encodeURIComponent(`Your HetMarketing OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`);
  return `https://wa.me/${phone}?text=${text}`;
}

function buildOtpEmail(fullName: string, otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #111827;">
      <h2 style="margin: 0 0 12px; font-size: 24px;">Verify your email</h2>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4b5563;">
        Hi ${fullName}, use the code below to complete your HetMarketing registration. It expires in ${OTP_EXPIRY_MINUTES} minutes.
      </p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: 700; margin: 0 0 24px;">
        ${otp}
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;
}

async function ensureUserDoesNotExist(email: string, mobile: string): Promise<void> {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { mobile }],
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email or mobile number already exists');
  }
}

async function invalidateUnusedOtps(email: string): Promise<void> {
  await prisma.otpVerification.updateMany({
    where: { email, used: false },
    data: { used: true },
  });
}

async function createOtp(email: string): Promise<string> {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: {
      email,
      otp,
      expiresAt,
    },
  });

  return otp;
}

async function issueOtp(email: string, fullName: string, mobile: string): Promise<OtpResponse> {
  await ensureUserDoesNotExist(email, mobile);
  await invalidateUnusedOtps(email);

  const otp = await createOtp(email);

  await sendEmail({
    to: email,
    subject: 'Your HetMarketing verification code',
    html: buildOtpEmail(fullName, otp),
  });

  return {
    message: 'OTP sent to your email.',
    whatsappLink: buildWhatsAppLink(mobile, otp),
  };
}

async function verifyOtp(email: string, otp: string): Promise<void> {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      otp,
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    throw new BadRequestError('Invalid OTP. Please try again.');
  }

  if (record.expiresAt < new Date()) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    throw new BadRequestError('OTP expired. Please request a new one.');
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { used: true },
  });
}

export async function sendRegistrationOtp(input: RegisterOtpSendInput): Promise<OtpResponse> {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);

  return issueOtp(email, input.fullName.trim(), mobile);
}

export async function resendRegistrationOtp(input: RegisterOtpResendInput): Promise<OtpResponse> {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);

  await ensureUserDoesNotExist(email, mobile);
  await invalidateUnusedOtps(email);

  const otp = await createOtp(email);

  await sendEmail({
    to: email,
    subject: 'Your HetMarketing verification code',
    html: buildOtpEmail(email, otp),
  });

  return {
    message: 'New OTP sent to your email.',
    whatsappLink: buildWhatsAppLink(mobile, otp),
  };
}

export async function verifyRegistrationOtp(input: RegisterOtpVerifyInput): Promise<{ message: string; user: CreatedUser }> {
  const email = normalizeEmail(input.email);
  const mobile = normalizeMobile(input.mobile);

  await verifyOtp(email, input.otp);
  await ensureUserDoesNotExist(email, mobile);

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      mobile,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      role: true,
    },
  });

  return {
    message: 'Account created successfully! Please login.',
    user,
  };
}