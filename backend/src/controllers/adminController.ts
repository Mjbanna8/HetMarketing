import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import * as productService from '../services/productService.js';
import * as categoryService from '../services/categoryService.js';
import * as orderService from '../services/orderService.js';
import * as settingsService from '../services/settingsService.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

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
    const removeImageIds = req.body.removeImageIds;
    const imageOrder = req.body.imageOrder;

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

  const [usersData, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { 
        id: true, 
        fullName: true, 
        email: true, 
        mobile: true, 
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  const users = usersData.map(u => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    mobile: u.mobile,
    createdAt: u.createdAt,
    totalOrders: u._count.orders,
    lastOrderAt: u.orders.length > 0 ? u.orders[0].createdAt : null,
  }));

  res.json(paginatedResponse(users, total, pageNum, limitNum));
});

export const getAdminUsersStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { prisma } = await import('../utils/prisma.js');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersToday, newUsersThisWeek, usersWithOrders] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
    prisma.user.count({ where: { orders: { some: {} } } }),
  ]);

  res.json(successResponse({
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    usersWithOrders,
    usersNoOrders: totalUsers - usersWithOrders,
  }));
});

export const getAdminUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { prisma } = await import('../utils/prisma.js');
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      orders: {
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { orders: true } }
    }
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  
  res.json(successResponse({
    ...userWithoutPassword,
    totalOrders: user._count.orders
  }));
});

export const deleteAdminUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { prisma } = await import('../utils/prisma.js');
  const id = req.params.id;
  
  if (req.user?.id === id) {
    res.status(403).json({ success: false, error: 'Cannot delete own account' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  await prisma.order.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  console.log(`Admin deleted user: ${user.email} (${user.id}) at ${new Date().toISOString()}`);

  res.json(successResponse({ message: 'User deleted successfully' }));
});

export const bulkDeleteAdminUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { prisma } = await import('../utils/prisma.js');
  const ids: string[] = req.body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, error: 'No user IDs provided' });
    return;
  }

  if (ids.length > 100) {
    res.status(400).json({ success: false, error: 'Cannot delete more than 100 users at once' });
    return;
  }

  if (req.user && ids.includes(req.user.id)) {
      res.status(403).json({ success: false, error: 'Cannot delete own account' });
      return;
  }

  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  console.log(`Admin bulk deleted ${count} users at ${new Date().toISOString()}`);

  res.json(successResponse({ deleted: count, message: `${count} users deleted successfully` }));
});

// About page image uploads
const ALLOWED_ABOUT_IMAGE_KEYS = [
  'about_founder_image',
  'about_member1_image',
  'about_member2_image',
];

export const uploadAboutImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { settingKey } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: 'No image file provided' });
    return;
  }

  if (!settingKey || !ALLOWED_ABOUT_IMAGE_KEYS.includes(settingKey)) {
    res.status(400).json({ success: false, error: `Invalid settingKey. Must be one of: ${ALLOWED_ABOUT_IMAGE_KEYS.join(', ')}` });
    return;
  }

  // Delete old image from Cloudinary if one exists
  const oldPublicId = await settingsService.getSetting(`${settingKey}_public_id`);
  if (oldPublicId) {
    try { await deleteFromCloudinary(oldPublicId); } catch { /* ignore */ }
  }

  // Upload new image
  const result = await uploadToCloudinary(file.buffer, 'about');

  // Persist url + publicId in SiteSetting
  await settingsService.updateSettings([
    { key: settingKey, value: result.url },
    { key: `${settingKey}_public_id`, value: result.publicId },
  ]);

  res.json(successResponse({ url: result.url, settingKey }));
});

export const deleteAboutImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { settingKey } = req.body;

  if (!settingKey || !ALLOWED_ABOUT_IMAGE_KEYS.includes(settingKey)) {
    res.status(400).json({ success: false, error: 'Invalid settingKey' });
    return;
  }

  const publicId = await settingsService.getSetting(`${settingKey}_public_id`);
  if (publicId) {
    try { await deleteFromCloudinary(publicId); } catch { /* ignore */ }
  }

  // Clear both keys
  await settingsService.updateSettings([
    { key: settingKey, value: '' },
    { key: `${settingKey}_public_id`, value: '' },
  ]);

  res.json(successResponse({ message: 'Image removed', settingKey }));
});

