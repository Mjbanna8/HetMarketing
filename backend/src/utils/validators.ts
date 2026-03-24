import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  mobile: z
    .string()
    .regex(/^\+\d{10,15}$/, 'Mobile must include country code (e.g., +919999999999)')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  emailOrMobile: z.string().min(1, 'Email or mobile is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const resendOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .trim()
    .optional(),
  mobile: z
    .string()
    .regex(/^\+\d{10,15}$/, 'Mobile must include country code')
    .trim()
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').trim(),
  price: z.coerce.number().positive('Price must be a positive number'),
  originalPrice: z.coerce.number().positive('Original price must be positive').optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
  tags: z.union([z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)), z.array(z.string())]).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100).trim(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createOrderSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Minimum quantity is 1').max(99, 'Maximum quantity is 99'),
  deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters').max(500).trim(),
  customerNote: z.string().max(300, 'Note must be at most 300 characters').trim().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
});

export const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one product ID required'),
  action: z.enum(['delete', 'activate', 'deactivate']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
