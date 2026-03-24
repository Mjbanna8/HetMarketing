import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import type { Product, Category } from '../types';
import { ProductCard, ProductGridSkeleton, EmptyState } from '../components/Shared';
import { formatINR, getRecentlyViewed } from '../utils';

export default function HomePage(): React.ReactElement {
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, latestRes, discountRes] = await Promise.all([
          categoriesApi.getAll(),
          productsApi.getLatest(),
          productsApi.getDiscounted(),
        ]);
        if (catRes.data.data) setCategories(catRes.data.data);
        if (latestRes.data.data) setLatestProducts(latestRes.data.data);
        if (discountRes.data.data) setDiscountedProducts(discountRes.data.data);
      } catch {
        // handled by empty states
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recentlyViewed = getRecentlyViewed();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container-page relative py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Shop & Order
              <span className="block mt-2">
                via <span className="text-green-300">WhatsApp</span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
              Browse our curated collection, pick your favorites, and order instantly through WhatsApp. No complicated checkout — just message and done!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn-primary bg-white text-primary-700 hover:bg-primary-50 text-base px-8">
                Browse Products
              </Link>
              <Link
                to="/products"
                className="btn border-2 border-white/30 text-white hover:bg-white/10 text-base px-8"
              >
                View Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <h2 className="section-title mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
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
        </section>
      )}

      {/* New Arrivals */}
      <section className="container-page py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/products" className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors">
            View All →
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : latestProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title="No products yet" message="Check back soon for our latest arrivals!" />
        )}
      </section>

      {/* Special Offers */}
      {discountedProducts.length > 0 && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {discountedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

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
