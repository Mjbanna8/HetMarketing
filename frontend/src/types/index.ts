export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
  createdAt: string;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  cdnPublicId: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  tags: string[];
  images: ProductImage[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
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
  status: 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  whatsappNumberUsed: string;
  createdAt: string;
}

export interface SiteSettings {
  store_name: string;
  store_logo_url: string;
  whatsapp_number: string;
  contact_email: string;
  wp_message_template?: string;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  ordersToday: number;
  outOfStockCount: number;
  totalUsers: number;
}

export interface ChartData {
  orderChart: Array<{ date: string; orders: number }>;
  categoryChart: Array<{ name: string; count: number }>;
}

export interface AdminUserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  usersWithOrders: number;
  usersNoOrders: number;
}

export interface UserAdminView {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  createdAt: string;
  totalOrders: number;
  lastOrderAt: string | null;
}

export interface UserDetailAdminView extends UserAdminView {
  orders: Array<Order & { product: { name: string } }>;
}
