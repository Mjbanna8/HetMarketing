import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { adminGuard } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  createProductSchema,
  bulkActionSchema,
  createCategorySchema,
  updateOrderStatusSchema,
  updateSettingsSchema,
} from '../utils/validators.js';
import * as categoryService from '../services/categoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { Request, Response } from 'express';

const router = Router();

router.use(adminGuard);

// Products
router.get('/products', adminController.getAdminProducts);
router.get('/products/trash', adminController.getTrashProducts);
router.get('/products/export', adminController.exportProducts);
router.post('/products', upload.array('images', 10), validate(createProductSchema), adminController.createProduct);
router.put('/products/:id', upload.array('images', 10), adminController.updateProduct);
router.delete('/products/:id', adminController.softDeleteProduct);
router.post('/products/:id/restore', adminController.restoreProduct);
router.delete('/products/:id/hard', adminController.hardDeleteProduct);
router.post('/products/bulk', validate(bulkActionSchema), adminController.bulkAction);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', upload.single('icon'), validate(createCategorySchema), adminController.createCategory);
router.put('/categories/:id', upload.single('icon'), adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Public categories route (also available without admin)
export const publicCategoriesRouter = Router();
publicCategoriesRouter.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  res.json(successResponse(categories));
}));

// Orders
router.get('/orders', adminController.getAdminOrders);
router.put('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.get('/orders/export', adminController.exportOrders);

// Dashboard
router.get('/dashboard/metrics', adminController.getDashboardMetrics);
router.get('/dashboard/chart', adminController.getDashboardChart);

// Admin Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(updateSettingsSchema), adminController.updateSettings);

// Users
router.get('/users', adminController.getAdminUsers);

export default router;
