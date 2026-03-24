import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store';
import { useAdminSessionWarning } from '../hooks';
import { authApi } from '../api';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { label: 'Products', path: '/admin/products', icon: '📦' },
  { label: 'Categories', path: '/admin/categories', icon: '🏷️' },
  { label: 'Orders', path: '/admin/orders', icon: '🛒' },
  { label: 'Users', path: '/admin/users', icon: '👥' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout(): React.ReactElement {
  const { admin, logout: adminLogout, isAuthenticated, isLoading } = useAdminAuthStore();
  const { showWarning, minutesRemaining, refreshSession, dismissWarning } = useAdminSessionWarning();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    adminLogout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  if (isLoading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Session Warning */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white p-3 text-center animate-slide-down">
          <span className="text-sm font-medium">
            Your session expires in {minutesRemaining} minute(s).
          </span>
          <button onClick={() => { refreshSession(); dismissWarning(); }} className="ml-4 px-4 py-1 bg-white text-amber-600 rounded-lg text-sm font-bold hover:bg-amber-50">
            Stay Logged In
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-200 h-16">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-100" aria-label="Toggle sidebar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link to="/admin/dashboard" className="text-xl font-bold text-primary-700">Admin Panel</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-surface-600 hidden sm:block">{admin?.email}</span>
            <button onClick={handleLogout} className="btn-ghost text-sm text-red-600">Logout</button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-surface-200 z-40 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                location.pathname.startsWith(item.path) ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors px-4 py-2" target="_blank">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View Storefront
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
