import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { CreateOrderInput } from '../utils/validators.js';

interface OrderWithDetails {
  id: string;
  userId: string;
  user: { id: string; fullName: string; email: string; mobile: string };
  productId: string;
  product: { id: string; name: string; slug: string; images: Array<{ url: string; isPrimary: boolean }> };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryAddress: string;
  customerNote: string | null;
  status: OrderStatus;
  whatsappNumberUsed: string;
  createdAt: Date;
}

const orderInclude = {
  user: { select: { id: true, fullName: true, email: true, mobile: true } },
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: { where: { isPrimary: true }, select: { url: true, isPrimary: true } },
    },
  },
};

export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<OrderWithDetails> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, price: true, status: true, isDeleted: true },
  });

  if (!product || product.isDeleted) {
    throw new NotFoundError('Product not found');
  }

  if (product.status !== 'ACTIVE') {
    throw new BadRequestError('This product is currently unavailable');
  }

  const whatsappSetting = await prisma.siteSetting.findUnique({
    where: { key: 'whatsapp_number' },
  });
  const whatsappNumber = whatsappSetting?.value ?? '+919999999999';

  const totalPrice = product.price * input.quantity;

  const order = await prisma.order.create({
    data: {
      userId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: product.price,
      totalPrice,
      deliveryAddress: input.deliveryAddress,
      customerNote: input.customerNote ?? null,
      status: OrderStatus.PENDING,
      whatsappNumberUsed: whatsappNumber,
    },
    include: orderInclude,
  });

  return order as OrderWithDetails;
}

export async function getUserOrders(userId: string): Promise<OrderWithDetails[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });

  return orders as OrderWithDetails[];
}

export async function getOrderById(
  orderId: string,
  userId?: string
): Promise<OrderWithDetails> {
  const where: Prisma.OrderWhereUniqueInput = { id: orderId };
  const order = await prisma.order.findUnique({
    where,
    include: orderInclude,
  });

  if (!order) throw new NotFoundError('Order not found');
  if (userId && order.userId !== userId) throw new NotFoundError('Order not found');

  return order as OrderWithDetails;
}

export async function getAdminOrders(
  from?: string,
  to?: string,
  search?: string,
  page = 1,
  limit = 20
): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const where: Prisma.OrderWhereInput = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { mobile: { contains: search } } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders as OrderWithDetails[], total };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: orderInclude,
  });

  return updated as OrderWithDetails;
}

export async function exportOrdersCSV(from?: string, to?: string): Promise<string> {
  const where: Prisma.OrderWhereInput = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });

  const header = 'Order ID,Customer Name,Mobile,Product,Quantity,Unit Price,Total Price,Address,Status,Date\n';
  const rows = orders.map((o) => {
    return [
      o.id,
      `"${o.user.fullName.replace(/"/g, '""')}"`,
      o.user.mobile,
      `"${o.product.name.replace(/"/g, '""')}"`,
      o.quantity,
      o.unitPrice,
      o.totalPrice,
      `"${o.deliveryAddress.replace(/"/g, '""')}"`,
      o.status,
      o.createdAt.toISOString(),
    ].join(',');
  });

  return header + rows.join('\n');
}

export async function getDashboardMetrics(): Promise<{
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  ordersToday: number;
  outOfStockCount: number;
  totalUsers: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalProducts, totalCategories, totalOrders, ordersToday, outOfStockCount, totalUsers] = await Promise.all([
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.product.count({ where: { isDeleted: false, status: 'OUT_OF_STOCK' } }),
    prisma.user.count({ where: { isVerified: true } }),
  ]);

  return { totalProducts, totalCategories, totalOrders, ordersToday, outOfStockCount, totalUsers };
}

export async function getDashboardChart(
  days = 30
): Promise<Array<{ date: string; orders: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const chartData: Record<string, number> = {};
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    chartData[key] = 0;
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().split('T')[0];
    if (chartData[key] !== undefined) {
      chartData[key]++;
    }
  }

  return Object.entries(chartData).map(([date, count]) => ({
    date,
    orders: count,
  }));
}

export async function getCategoryDistribution(): Promise<Array<{ name: string; count: number }>> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: { where: { isDeleted: false } } } } },
    orderBy: { displayOrder: 'asc' },
  });

  return categories.map((c) => ({
    name: c.name,
    count: c._count.products,
  }));
}
