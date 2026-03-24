import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as authService from '../services/authService.js';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerUser(req.body);

  res.status(201).json(successResponse(result));
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.loginUser(req.body);

  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json(
    successResponse({
      user: result.user,
      accessToken: result.tokens.accessToken,
    })
  );
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, otp } = req.body;
  const result = await authService.verifyOtp(userId, otp);

  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json(
    successResponse({
      user: result.user,
      accessToken: result.tokens.accessToken,
    })
  );
});

export const resendOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;
  const result = await authService.resendOtp(userId);
  res.json(successResponse(result));
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken', { path: '/' });
  res.json(successResponse({ message: 'Logged out successfully' }));
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ success: false, error: 'Refresh token not found' });
    return;
  }

  const tokens = await authService.refreshTokens(token);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json(successResponse({ accessToken: tokens.accessToken }));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.forgotPassword(req.body);
  res.json(
    successResponse({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.resetPassword(req.body);
  res.json(successResponse({ message: 'Password has been reset successfully' }));
});

export const adminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.adminLogin(req.body);

  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });

  res.json(
    successResponse({
      admin: result.admin,
      accessToken: result.tokens.accessToken,
    })
  );
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getUserProfile(req.user!.id);
  res.json(successResponse(user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  res.json(successResponse(user));
});
