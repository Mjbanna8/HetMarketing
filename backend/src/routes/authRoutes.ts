import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as otpController from '../controllers/otpController.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { authGuard } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminLoginSchema,
  updateProfileSchema,
  registerOtpSendSchema,
  registerOtpVerifySchema,
  registerOtpResendSchema,
} from '../utils/validators.js';

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register/send-otp', otpLimiter, validate(registerOtpSendSchema), otpController.sendRegisterOtp);
router.post('/register/verify-otp', validate(registerOtpVerifySchema), otpController.verifyRegisterOtp);
router.post('/register/resend-otp', otpLimiter, validate(registerOtpResendSchema), otpController.resendRegisterOtp);

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin);

router.get('/profile', authGuard, authController.getProfile);
router.put('/profile', authGuard, validate(updateProfileSchema), authController.updateProfile);

export default router;
