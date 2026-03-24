import api from './client';
import type {
  ApiResponse,
  PaginatedData,
  Product,
  Category,
  Order,
  User,
  SiteSettings,
  DashboardMetrics,
  ChartData,
} from '../types';

// Auth API
export const authApi = {
  register: (data: { fullName: string; email: string; mobile: string; password: string; confirmPassword: string }) =>
    api.post<ApiResponse<{ message: string; userId: string; user: import('../types').User; accessToken: string }>>('/auth/register', data),

  verifyOtp: (data: { userId: string; otp: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/verify-otp', data),

  resendOtp: (data: { userId: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/resend-otp', data),

  login: (data: { emailOrMobile: string; password: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  refresh: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data),

  adminLogin: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ admin: { id: string; email: string; role: string; mustChangePassword: boolean }; accessToken: string }>>('/auth/admin/login', data),

  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: { fullName?: string; mobile?: string; currentPassword?: string; newPassword?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile', data),
};

// Products API (public)
export const productsApi = {
  getAll: (params?: { category?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Product>>>('/products', { params }),

  search: (q: string) =>
    api.get<ApiResponse<Product[]>>('/products/search', { params: { q } }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/${slug}`),

  getLatest: () =>
    api.get<ApiResponse<Product[]>>('/products/latest'),

  getDiscounted: () =>
    api.get<ApiResponse<Product[]>>('/products/discounted'),
};

// Categories API (public)
export const categoriesApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
};

// Orders API (customer)
export const ordersApi = {
  create: (data: { productId: string; quantity: number; deliveryAddress: string; customerNote?: string }) =>
    api.post<ApiResponse<Order>>('/orders', data),

  getMy: () => api.get<ApiResponse<Order[]>>('/orders/my'),

  getById: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),
};

// Settings API (public)
export const settingsApi = {
  getPublic: () => api.get<ApiResponse<SiteSettings>>('/settings'),
};

// Admin API
export const adminApi = {
  // Products
  getProducts: (params?: { search?: string; sort?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Product>>>('/admin/products', { params }),

  getTrashProducts: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Product>>>('/admin/products/trash', { params }),

  createProduct: (formData: FormData) =>
    api.post<ApiResponse<Product>>('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateProduct: (id: string, formData: FormData) =>
    api.put<ApiResponse<Product>>(`/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteProduct: (id: string) =>
    api.delete<ApiResponse>(`/admin/products/${id}`),

  restoreProduct: (id: string) =>
    api.post<ApiResponse<Product>>(`/admin/products/${id}/restore`),

  hardDeleteProduct: (id: string) =>
    api.delete<ApiResponse>(`/admin/products/${id}/hard`),

  bulkAction: (data: { ids: string[]; action: 'delete' | 'activate' | 'deactivate' }) =>
    api.post<ApiResponse<{ count: number }>>('/admin/products/bulk', data),

  exportProducts: () =>
    api.get('/admin/products/export', { responseType: 'blob' }),

  // Categories
  getCategories: () => api.get<ApiResponse<Category[]>>('/admin/categories'),

  createCategory: (formData: FormData) =>
    api.post<ApiResponse<Category>>('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCategory: (id: string, formData: FormData) =>
    api.put<ApiResponse<Category>>(`/admin/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteCategory: (id: string, reassignCategoryId?: string) =>
    api.delete<ApiResponse>(`/admin/categories/${id}`, { data: { reassignCategoryId } }),

  // Orders
  getOrders: (params?: { from?: string; to?: string; search?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Order>>>('/admin/orders', { params }),

  updateOrderStatus: (id: string, status: string) =>
    api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status }),

  exportOrders: (params?: { from?: string; to?: string }) =>
    api.get('/admin/orders/export', { params, responseType: 'blob' }),

  // Dashboard
  getMetrics: () => api.get<ApiResponse<DashboardMetrics>>('/admin/dashboard/metrics'),

  getChart: (days?: number) =>
    api.get<ApiResponse<ChartData>>('/admin/dashboard/chart', { params: { days } }),

  // Settings
  getSettings: () => api.get<ApiResponse<Record<string, string>>>('/admin/settings'),

  updateSettings: (settings: Array<{ key: string; value: string }>) =>
    api.put<ApiResponse<Record<string, string>>>('/admin/settings', { settings }),

  // Users
  getUsers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<import('../types').UserAdminView>>>('/admin/users', { params }),

  getUserById: (id: string) =>
    api.get<ApiResponse<import('../types').UserDetailAdminView>>(`/admin/users/${id}`),

  deleteUser: (id: string) =>
    api.delete<ApiResponse>(`/admin/users/${id}`),

  bulkDeleteUsers: (data: { ids: string[] }) =>
    api.post<ApiResponse<{ deleted: number }>>('/admin/users/bulk-delete', data),

  getUserStats: () =>
    api.get<ApiResponse<import('../types').AdminUserStats>>('/admin/users/stats'),
};
