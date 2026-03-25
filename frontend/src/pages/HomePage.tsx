import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import type { Product, Category } from '../types';
import { ProductCard, ProductGridSkeleton, EmptyState } from '../components/Shared';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { formatINR, getRecentlyViewed } from '../utils';

export default function HomePage(): React.ReactElement {
  // Independent states for each section
  const [categories, setCategories] = useState<{ data: Category[]; loading: boolean; error: boolean }>({
    data: [],
    loading: true,
    error: false,
  });
  const [latestProducts, setLatestProducts] = useState<{ data: Product[]; loading: boolean; error: boolean }>({
    data: [],
    loading: true,
    error: false,
  });
  const [discountedProducts, setDiscountedProducts] = useState<{ data: Product[]; loading: boolean; error: boolean }>({
    data: [],
    loading: true,
    error: false,
  });

  // Independent fetching for Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        setCategories({ data: res.data.data || [], loading: false, error: false });
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories(prev => ({ ...prev, loading: false, error: true }));
      }
    };
    fetchCategories();
  }, []);

  // Independent fetching for New Arrivals
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await productsApi.getLatest();
        setLatestProducts({ data: res.data.data || [], loading: false, error: false });
      } catch (err) {
        console.error('Failed to fetch latest products:', err);
        setLatestProducts(prev => ({ ...prev, loading: false, error: true }));
      }
    };
    fetchLatest();
  }, []);

  // Independent fetching for Special Offers
  useEffect(() => {
    const fetchDiscounted = async () => {
      try {
        const res = await productsApi.getDiscounted();
        setDiscountedProducts({ data: res.data.data || [], loading: false, error: false });
      } catch (err) {
        console.error('Failed to fetch discounted products:', err);
        setDiscountedProducts(prev => ({ ...prev, loading: false, error: true }));
      }
    };
    fetchDiscounted();
  }, []);

  const recentlyViewed = getRecentlyViewed();

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <section 
        className="relative min-h-[80vh] flex items-center bg-cover bg-center bg-no-repeat text-white overflow-hidden"
        style={{ backgroundImage: "url('/images/hero.png')" }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-0" />
        
        <div className="container-page relative z-10 py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Shop & Order
              <span className="block mt-2">
                via <span className="text-green-300">WhatsApp</span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
              Browse our curated collection, pick your favorites, and order instantly through WhatsApp. No complicated checkout — just message and done!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn-primary bg-white text-primary-700 hover:bg-primary-50 text-base px-8 transition-transform hover:scale-105 active:scale-95">
                Browse Products
              </Link>
              <Link
                to="/products"
                className="btn border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base px-8 transition-transform hover:scale-105 active:scale-95"
              >
                View Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <ErrorBoundary>
        <section className="container-page py-12 md:py-16">
          <h2 className="section-title mb-8">Shop by Category</h2>
          {categories.loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-6 h-32 animate-pulse bg-surface-50" />
              ))}
            </div>
          ) : categories.error ? (
            <div className="p-8 rounded-2xl bg-surface-50 border border-surface-100 text-center">
              <p className="text-surface-600 mb-4">We're having trouble loading categories right now.</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-primary-600 font-medium hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : categories.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.data.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products/category/${cat.slug}`}
                  className="card p-6 text-center group hover:border-primary-200 transition-all"
                  id={`category-${cat.slug}`}
                >
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} alt={cat.name} className="w-12 h-12 mx-auto mb-3 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} />
                  ) : (
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                  {cat._count !== undefined && (
                    <p className="text-xs text-surface-400 mt-1">{cat._count.products} products</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No categories" message="We're setting up our categories. Check back soon!" />
          )}
        </section>
      </ErrorBoundary>

      {/* New Arrivals */}
      <ErrorBoundary>
        <section className="container-page py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">New Arrivals</h2>
            <Link to="/products" className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors">
              View All →
            </Link>
          </div>
          {latestProducts.loading ? (
            <ProductGridSkeleton count={4} />
          ) : latestProducts.error ? (
            <div className="p-12 rounded-2xl bg-surface-50 border border-surface-100 text-center">
               <svg className="w-12 h-12 text-surface-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-surface-900 mb-2">Failed to load arrivals</h3>
              <p className="text-surface-500 mb-6">Something went wrong while fetching our newest products.</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Retry Loading
              </button>
            </div>
          ) : latestProducts.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestProducts.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState title="No products yet" message="Check back soon for our latest arrivals!" />
          )}
        </section>
      </ErrorBoundary>

      {/* Special Offers */}
      <ErrorBoundary>
        {(discountedProducts.loading || discountedProducts.data.length > 0 || discountedProducts.error) && (
          <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12 md:py-16">
            <div className="container-page">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="section-title">Special Offers</h2>
                  <p className="text-surface-500 mt-1">Grab these deals before they're gone</p>
                </div>
                <Link to="/products" className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors">
                  View All →
                </Link>
              </div>
              {discountedProducts.loading ? (
                <ProductGridSkeleton count={4} />
              ) : discountedProducts.error ? (
                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-red-100 text-center">
                  <p className="text-red-600 font-medium">Offers temporarily unavailable</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {discountedProducts.data.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </ErrorBoundary>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <h2 className="section-title mb-8">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentlyViewed.map((item) => (
              <Link
                key={item.slug}
                to={`/products/${item.slug}`}
                className="card overflow-hidden group"
              >
                <div className="aspect-square bg-surface-50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-300">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-surface-900 truncate">{item.name}</p>
                  <p className="text-sm font-bold text-primary-600">{formatINR(item.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
