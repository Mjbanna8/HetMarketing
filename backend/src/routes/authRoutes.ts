import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authGuard } from '../middleware/auth.js';
import { authLimiter, resendOtpLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminLoginSchema,
  updateProfileSchema,
} from '../utils/validators.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', resendOtpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin);

router.get('/profile', authGuard, authController.getProfile);
router.put('/profile', authGuard, validate(updateProfileSchema), authController.updateProfile);

export default router;
