import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  TooManyRequestsError,
  NotFoundError,
} from '../utils/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateAdminAccessToken,
} from '../middleware/auth.js';
import { sendEmail, buildResetPasswordEmail } from '../utils/email.js';
import { config } from '../config/index.js';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AdminLoginInput,
  UpdateProfileInput,
} from '../utils/validators.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const resetTokenStore = new Map<string, { userId: string; expiresAt: Date; used: boolean }>();

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
}

export async function registerUser(
  input: RegisterInput
): Promise<{ message: string; userId: string }> {
  const { fullName, email, mobile, password } = input;

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  const existingByMobile = await prisma.user.findUnique({ where: { mobile } });

  // Block if a VERIFIED account already owns this email or mobile
  if (existingByEmail && existingByEmail.isVerified) {
    throw new ConflictError('An account with this email already exists');
  }
  if (existingByMobile && existingByMobile.isVerified) {
    throw new ConflictError('An account with this mobile number already exists');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const passwordHash = await bcrypt.hash(password, 12);

  let userId: string;

  // Ghost account exists (unverified) — update it with fresh credentials & OTP
  const ghostAccount = existingByEmail || existingByMobile;
  if (ghostAccount) {
    await prisma.user.update({
      where: { id: ghostAccount.id },
      data: { fullName, email, mobile, passwordHash, otpCode: otpHash, otpExpiresAt },
    });
    userId = ghostAccount.id;
    logger.info({ userId }, 'Ghost account updated with fresh OTP');
  } else {
    // Brand new user — create fresh
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        mobile,
        passwordHash,
        isVerified: false,
        otpCode: otpHash,
        otpExpiresAt,
      },
      select: { id: true },
    });
    userId = user.id;
    logger.info({ userId }, 'New user created');
  }

  // Send OTP email (non-blocking)
  let emailSent = false;
  try {
    await sendEmail({
      to: email,
      subject: 'Your WA Commerce verification code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to WA Commerce!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #25D366; letter-spacing: 5px;">${otp}</h1>
          <p>This code is valid for 10 minutes. Please do not share this code with anyone.</p>
        </div>
      `,
    });
    emailSent = true;
  } catch (emailErr) {
    logger.warn({ userId, error: emailErr }, 'Failed to send OTP email');
    if (process.env.NODE_ENV === 'development') {
      logger.info({ userId, otp }, '⚠️ DEV MODE — OTP for manual verification');
    }
  }

  return {
    message: emailSent
      ? 'OTP sent to your email'
      : 'Account created. OTP email could not be sent — check server logs for your code.',
    userId,
  };
}

export async function loginUser(
  input: LoginInput
): Promise<{ user: UserInfo; tokens: AuthTokens }> {
  const { emailOrMobile, password } = input;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrMobile.toLowerCase() }, { mobile: emailOrMobile }],
    },
  });

  if (!user) {
    throw new UnauthorizedError('Incorrect credentials');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new TooManyRequestsError(
      `Account locked. Please try again in ${remainingMinutes} minute(s).`
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const failedLogins = user.failedLogins + 1;
    const updateData: Record<string, unknown> = { failedLogins };

    if (failedLogins >= LOCKOUT_THRESHOLD) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      updateData.failedLogins = 0;
      logger.warn({ userId: user.id }, 'Account locked after too many failed attempts');
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });
    throw new UnauthorizedError('Incorrect credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null },
  });

  const tokenPayload = { id: user.id, email: user.email, role: user.role as 'CUSTOMER' };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: { id: user.id, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role },
    tokens: { accessToken, refreshToken },
  };
}

export async function verifyOtp(userId: string, otp: string): Promise<{ user: UserInfo; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.isVerified) throw new BadRequestError('Already verified');
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new BadRequestError('OTP expired. Request a new one.');
  }

  const isValid = await bcrypt.compare(otp, user.otpCode || '');
  if (!isValid) throw new BadRequestError('Incorrect OTP');

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, otpCode: null, otpExpiresAt: null },
  });

  const tokenPayload = { id: user.id, email: user.email, role: user.role as 'CUSTOMER' };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: { id: user.id, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role },
    tokens: { accessToken, refreshToken },
  };
}

export async function resendOtp(userId: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.isVerified) throw new BadRequestError('Already verified');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 8);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { otpCode: otpHash, otpExpiresAt },
  });

  await sendEmail({
    to: user.email,
    subject: 'Your new WA Commerce verification code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to WA Commerce!</h2>
        <p>Your new verification code is:</p>
        <h1 style="color: #25D366; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes. Please do not share this code with anyone.</p>
      </div>
    `,
  });

  return { message: 'New OTP sent' };
}

export async function refreshTokens(token: string): Promise<AuthTokens> {
  const decoded = verifyRefreshToken(token);

  if (decoded.role === 'CUSTOMER') {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedError('User not found');

    const payload = { id: user.id, email: user.email, role: user.role as 'CUSTOMER' };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  if (decoded.role === 'ADMIN') {
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });
    if (!admin) throw new UnauthorizedError('Admin not found');

    const payload = { id: admin.id, email: admin.email, role: admin.role as 'ADMIN' };
    return {
      accessToken: generateAdminAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  throw new UnauthorizedError('Invalid token role');
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const { email } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  resetTokenStore.set(token, { userId: user.id, expiresAt, used: false });

  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
  const html = buildResetPasswordEmail(resetUrl);

  await sendEmail({
    to: email,
    subject: 'Reset Your Password — WA Commerce',
    html,
  });

  logger.info({ userId: user.id }, 'Password reset email sent');
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const { token, password } = input;

  const stored = resetTokenStore.get(token);
  if (!stored) {
    throw new BadRequestError('Invalid or expired reset link');
  }

  if (stored.used) {
    throw new BadRequestError('This reset link has already been used');
  }

  if (stored.expiresAt < new Date()) {
    resetTokenStore.delete(token);
    throw new BadRequestError('This reset link has expired');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: stored.userId },
    data: { passwordHash, failedLogins: 0, lockedUntil: null },
  });

  stored.used = true;
  resetTokenStore.delete(token);

  logger.info({ userId: stored.userId }, 'Password reset successful');
}

export async function adminLogin(
  input: AdminLoginInput
): Promise<{ admin: { id: string; email: string; role: string; mustChangePassword: boolean }; tokens: AuthTokens }> {
  const { email, password } = input;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    throw new UnauthorizedError('Incorrect credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Incorrect credentials');
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  const tokenPayload = { id: admin.id, email: admin.email, role: admin.role as 'ADMIN' };
  const accessToken = generateAdminAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  logger.info({ adminId: admin.id }, 'Admin logged in');

  return {
    admin: { id: admin.id, email: admin.email, role: admin.role, mustChangePassword: admin.mustChangePassword },
    tokens: { accessToken, refreshToken },
  };
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserInfo> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const updateData: Record<string, unknown> = {};

  if (input.fullName) updateData.fullName = input.fullName;

  if (input.mobile) {
    const existing = await prisma.user.findUnique({ where: { mobile: input.mobile } });
    if (existing && existing.id !== userId) {
      throw new ConflictError('This mobile number is already in use');
    }
    updateData.mobile = input.mobile;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new BadRequestError('Current password is required to set a new password');
    }
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }
    updateData.passwordHash = await bcrypt.hash(input.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, fullName: true, email: true, mobile: true, role: true },
  });

  return { id: updated.id, fullName: updated.fullName, email: updated.email, mobile: updated.mobile, role: updated.role };
}

export async function getUserProfile(userId: string): Promise<UserInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, mobile: true, role: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return { id: user.id, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role };
}
