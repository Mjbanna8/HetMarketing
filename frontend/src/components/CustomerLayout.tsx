import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiInfo } from 'react-icons/fi';
import { useAuthStore, useSettingsStore } from '../store';
import { useDebounce } from '../hooks';
import { productsApi, authApi } from '../api';
import type { Product } from '../types';
import { formatINR } from '../utils';
import toast from 'react-hot-toast';

function Header(): React.ReactElement {
  const { user, isAuthenticated, logout: authLogout } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearch.length >= 3) {
      productsApi
        .search(debouncedSearch)
        .then(({ data }) => {
          if (data.data) setSearchResults(data.data);
        })
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    authLogout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const storeName = settings?.store_name ?? 'HetMarketing';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-100">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src={settings?.store_logo_url || "/logo.png"} 
              alt={storeName} 
              className="h-10 md:h-14 w-auto object-contain"
              onError={(e) => {
                // If /logo.png also fails, show text logo
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {storeName}
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8 relative" ref={searchRef}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search products..."
                className="input-field pl-10 pr-4 py-2.5 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                id="global-search"
              />
            </div>

            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-surface-100 max-h-80 overflow-y-auto z-50">
                {searchResults.map((product) => {
                  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-surface-50 transition-colors"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                    >
                      {img ? (
                        <img src={img.url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{product.name}</p>
                        <p className="text-sm text-primary-600 font-semibold">{formatINR(product.price)}</p>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="block text-center p-3 text-sm text-primary-600 font-medium hover:bg-surface-50 border-t border-surface-100"
                  onClick={() => setShowSearch(false)}
                >
                  View all results →
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/products" className="btn-ghost text-sm">Products</Link>
            <Link to="/about" className="btn-ghost text-sm">About</Link>
            {isAuthenticated ? (
              <>
                <Link to="/account" className="btn-ghost text-sm">
                  Hi, {user?.fullName.split(' ')[0]}
                </Link>
                <Link to="/account/orders" className="btn-ghost text-sm">Orders</Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-surface-100 animate-slide-down">
            {/* Mobile Search */}
            <div className="py-3">
              <input
                type="search"
                placeholder="Search products..."
                className="input-field text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.length >= 3) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setMobileMenuOpen(false);
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <Link to="/products" className="py-3 text-surface-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Products</Link>
              <Link to="/about" className="py-3 text-surface-700 font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/account" className="py-3 text-surface-700 font-medium" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                  <Link to="/account/orders" className="py-3 text-surface-700 font-medium" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="py-3 text-left text-red-600 font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="py-3 text-surface-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="py-3 text-primary-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings);
  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{settings?.store_name ?? 'HetMarketing'}</h3>
            <p className="text-sm leading-relaxed">Order your favorite products directly via WhatsApp. Fast, easy, and convenient shopping experience.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              {settings?.contact_email && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {settings.contact_email}
                </li>
              )}
              {settings?.whatsapp_number && (
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                  {settings.whatsapp_number}
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-surface-800 text-center text-xs text-surface-500">
          © {new Date().getFullYear()} {settings?.store_name ?? 'HetMarketing'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function BottomNav(): React.ReactElement {
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Product', path: '/products', icon: FiShoppingBag },
    { name: 'About', path: '/about', icon: FiInfo },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary-600' : 'text-surface-500 hover:text-surface-900'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function CustomerLayout(): React.ReactElement {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
