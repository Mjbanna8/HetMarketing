import { Router } from 'express';
import * as authController from '../controllers/authController.js';
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
} from '../utils/validators.js';

const router = Router();

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
