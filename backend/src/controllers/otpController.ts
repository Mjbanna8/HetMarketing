import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as otpService from '../services/otpService.js';

export const sendRegisterOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await otpService.sendRegistrationOtp(req.body);
  res.status(200).json(successResponse(result));
});

export const verifyRegisterOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await otpService.verifyRegistrationOtp(req.body);
  res.status(201).json(successResponse(result));
});

export const resendRegisterOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await otpService.resendRegistrationOtp(req.body);
  res.status(200).json(successResponse(result));
});