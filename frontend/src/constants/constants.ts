/**
 * AUTHENTICATION CONSTANTS
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  ADMIN_ACCESS_TOKEN: 'adminAccessToken',
  USER_INFO: 'user',
  ADMIN_INFO: 'admin',
};

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '30d',
  ADMIN_ACCESS_TOKEN: '8h',
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  ADMIN_LOGIN: '/auth/admin/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
};
