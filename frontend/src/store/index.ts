import { create } from 'zustand';
import type { User, SiteSettings } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));

// Admin auth store (separate from customer)
interface AdminAuthState {
  admin: { id: string; email: string; role: string; mustChangePassword: boolean } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: number | null;
  setAuth: (admin: { id: string; email: string; role: string; mustChangePassword: boolean }, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  refreshSession: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  sessionExpiry: null,

  setAuth: (admin, accessToken) => {
    const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
    localStorage.setItem('adminAccessToken', accessToken);
    localStorage.setItem('admin', JSON.stringify(admin));
    localStorage.setItem('adminSessionExpiry', expiry.toString());
    set({ admin, accessToken, isAuthenticated: true, isLoading: false, sessionExpiry: expiry });
  },

  logout: () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminSessionExpiry');
    set({ admin: null, accessToken: null, isAuthenticated: false, isLoading: false, sessionExpiry: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: () => {
    const token = localStorage.getItem('adminAccessToken');
    const adminStr = localStorage.getItem('admin');
    const expiryStr = localStorage.getItem('adminSessionExpiry');

    if (token && adminStr && expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() < expiry) {
        try {
          const admin = JSON.parse(adminStr) as { id: string; email: string; role: string; mustChangePassword: boolean };
          set({ admin, accessToken: token, isAuthenticated: true, isLoading: false, sessionExpiry: expiry });
        } catch {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('admin');
          localStorage.removeItem('adminSessionExpiry');
          set({ isLoading: false });
        }
      } else {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('admin');
        localStorage.removeItem('adminSessionExpiry');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  refreshSession: () => {
    const expiry = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('adminSessionExpiry', expiry.toString());
    set({ sessionExpiry: expiry });
  },
}));

// Site settings store
interface SettingsState {
  settings: SiteSettings | null;
  isLoading: boolean;
  setSettings: (settings: SiteSettings) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,
  setSettings: (settings) => set({ settings, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
