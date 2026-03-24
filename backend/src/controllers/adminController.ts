import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import * as productService from '../services/productService.js';
import * as categoryService from '../services/categoryService.js';
import * as orderService from '../services/orderService.js';
import * as settingsService from '../services/settingsService.js';

// Admin Products
export const getAdminProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, sort, page, limit } = req.query;
  const result = await productService.getAdminProducts(
    search as string,
    sort as string,
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 20
  );
  res.json(paginatedResponse(result.products, result.total, parseInt(page as string, 10) || 1, parseInt(limit as string, 10) || 20));
});

export const getTrashProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query;
  const result = await productService.getAdminProducts(
    undefined,
    undefined,
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 20,
    true
  );
  res.json(paginatedResponse(result.products, result.total, parseInt(page as string, 10) || 1, parseInt(limit as string, 10) || 20));
});

export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const imageBuffers = files ? files.map((f) => f.buffer) : [];
    const product = await productService.createProduct(req.body, imageBuffers);
    res.status(201).json(successResponse(product));
  } catch (err: any) {
    if (err.message && (err.message.includes('A product with') || err.message.includes('Invalid category'))) {
      throw err; // Let asyncHandler and ErrorHandler deal with validation errors
    }
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: err?.message ?? 'Image upload failed' });
  }
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const newImageBuffers = files ? files.map((f) => f.buffer) : [];
    const removeImageIds = req.body.removeImageIds
      ? JSON.parse(req.body.removeImageIds)
      : undefined;
    const imageOrder = req.body.imageOrder
      ? JSON.parse(req.body.imageOrder)
      : undefined;

    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      newImageBuffers.length > 0 ? newImageBuffers : undefined,
      removeImageIds,
      imageOrder
    );

    res.json(successResponse(product));
  } catch (err: any) {
    if (err.statusCode) {
      throw err; // Let Documented Errors pass to Error Handler
    }
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: err?.message ?? 'Image upload failed' });
  }
});

export const softDeleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await productService.softDeleteProduct(req.params.id);
  res.json(successResponse({ message: 'Product moved to trash' }));
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.restoreProduct(req.params.id);
  res.json(successResponse(product));
});

export const hardDeleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await productService.hardDeleteProduct(req.params.id);
  res.json(successResponse({ message: 'Product permanently deleted' }));
});

export const bulkAction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const count = await productService.bulkAction(req.body);
  res.json(successResponse({ message: `${count} product(s) updated`, count }));
});

export const exportProducts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const csv = await productService.exportProductsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.send(csv);
});

// Admin Categories
export const getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  res.json(successResponse(categories));
});

export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const category = await categoryService.createCategory(req.body.name, file?.buffer);
    res.status(201).json(successResponse(category));
  } catch (err: any) {
    if (err.statusCode) throw err;
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: err?.message ?? 'Image upload failed' });
  }
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const category = await categoryService.updateCategory(req.params.id, req.body.name, file?.buffer);
    res.json(successResponse(category));
  } catch (err: any) {
    if (err.statusCode) throw err;
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: err?.message ?? 'Image upload failed' });
  }
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await categoryService.deleteCategory(req.params.id, req.body.reassignCategoryId);
  res.json(successResponse({ message: 'Category deleted' }));
});

// Admin Orders
export const getAdminOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { from, to, search, page, limit } = req.query;
  const result = await orderService.getAdminOrders(
    from as string,
    to as string,
    search as string,
    parseInt(page as string, 10) || 1,
    parseInt(limit as string, 10) || 20
  );
  res.json(paginatedResponse(result.orders, result.total, parseInt(page as string, 10) || 1, parseInt(limit as string, 10) || 20));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  res.json(successResponse(order));
});

export const exportOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;
  const csv = await orderService.exportOrdersCSV(from as string, to as string);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send(csv);
});

// Admin Dashboard
export const getDashboardMetrics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const metrics = await orderService.getDashboardMetrics();
  res.json(successResponse(metrics));
});

export const getDashboardChart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const days = parseInt(req.query.days as string, 10) || 30;
  const [chartData, categoryData] = await Promise.all([
    orderService.getDashboardChart(days),
    orderService.getCategoryDistribution(),
  ]);
  res.json(successResponse({ orderChart: chartData, categoryChart: categoryData }));
});

// Admin Settings
export const getSettings = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.getAllSettings();
  res.json(successResponse(settings));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const settings = await settingsService.updateSettings(req.body.settings);
  res.json(successResponse(settings));
});

// Admin Users
export const getAdminUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, page, limit } = req.query;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;

  const { Prisma } = await import('@prisma/client');
  const { prisma } = await import('../utils/prisma.js');

  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
      { mobile: { contains: search as string } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, mobile: true, role: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json(paginatedResponse(users, total, pageNum, limitNum));
});
