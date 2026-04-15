import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useInitializeAuth, useInitializeAdminAuth, useLoadSettings } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import CustomerLayout from './components/CustomerLayout';
import { PageLoader } from './components/Shared';

// Lazy-loaded customer pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderConfirmPage = lazy(() => import('./pages/OrderConfirmPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminAboutPage = lazy(() => import('./pages/admin/AdminAboutPage'));

function AppInitializer({ children }: { children: React.ReactNode }): React.ReactElement {
  useInitializeAuth();
  useInitializeAdminAuth();
  useLoadSettings();
  return <>{children}</>;
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInitializer>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Customer Routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/category/:slug" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/account/orders" element={<MyOrdersPage />} />
                <Route path="/order-confirm/:id" element={<OrderConfirmPage />} />
                <Route path="/about" element={<AboutUs />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/add" element={<AdminProductFormPage />} />
                <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="about" element={<AdminAboutPage />} />
                <Route path="users" element={<AdminUsersPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#18181b',
              color: '#fff',
              fontSize: '14px',
            },
            success: { style: { background: '#059669' } },
            error: { style: { background: '#dc2626' } },
          }}
        />
      </AppInitializer>
    </BrowserRouter>
  );
}
