import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAdminAuthStore, useSettingsStore } from '../store';
import { settingsApi } from '../api';
import type { Product } from '../types';
import { addToRecentlyViewed } from '../utils';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function useInitializeAuth(): void {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
}

export function useInitializeAdminAuth(): void {
  const initialize = useAdminAuthStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
}

export function useLoadSettings(): void {
  const setSettings = useSettingsStore((s) => s.setSettings);
  const setLoading = useSettingsStore((s) => s.setLoading);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await settingsApi.getPublic();
        if (data.data) {
          setSettings(data.data);
        }
      } catch {
        setLoading(false);
      }
    };
    load();
  }, [setSettings, setLoading]);
}

export function useRequireAuth(redirectTo = '/login'): boolean {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return isAuthenticated;
}

export function useRequireAdmin(): boolean {
  const { isAuthenticated, isLoading } = useAdminAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return isAuthenticated;
}

export function useAdminSessionWarning(): {
  showWarning: boolean;
  minutesRemaining: number;
  refreshSession: () => void;
  dismissWarning: () => void;
} {
  const { sessionExpiry, refreshSession, logout } = useAdminAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

  useEffect(() => {
    if (!sessionExpiry) return;

    const interval = setInterval(() => {
      const remaining = sessionExpiry - Date.now();
      const mins = Math.ceil(remaining / 60000);
      setMinutesRemaining(mins);

      if (remaining <= 0) {
        logout();
        clearInterval(interval);
      } else if (remaining <= 5 * 60 * 1000) {
        setShowWarning(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionExpiry, logout]);

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  return { showWarning, minutesRemaining, refreshSession, dismissWarning };
}

export function useTrackProductView(product: Product | null): void {
  const tracked = useRef(false);
  useEffect(() => {
    if (product && !tracked.current) {
      tracked.current = true;
      const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
      addToRecentlyViewed({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: primaryImage?.url ?? '',
      });
    }
  }, [product]);
}
