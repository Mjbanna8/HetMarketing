import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import type { Product, Category } from '../types';
import { ProductCard, ProductGridSkeleton, EmptyState } from '../components/Shared';

export default function ProductsPage(): React.ReactElement {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const selectedCategory = categorySlug ?? searchParams.get('category') ?? undefined;

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice ?? 0, maxPrice ?? 50000]);

  // Sync priceRange state when URL params change (e.g. after "Clear Filters")
  useEffect(() => {
    setPriceRange([minPrice ?? 0, maxPrice ?? 50000]);
  }, [minPrice, maxPrice]);

  const fetchProducts = useCallback(async (currentPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const { data } = await productsApi.getAll({
        category: selectedCategory,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
        page: currentPage,
        limit: 12,
      });
      const resultData = data.data;
      if (resultData) {
        if (append) {
          setProducts((prev) => [...prev, ...resultData.items]);
        } else {
          setProducts(resultData.items);
        }
        setTotal(resultData.total);
      }
    } catch {
      if (!append) setProducts([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [selectedCategory, priceRange]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  useEffect(() => {
    categoriesApi.getAll().then(({ data }) => {
      if (data.data) setCategories(data.data);
    }).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / 12);

  const handleCategoryFilter = (catSlug: string | null) => {
    const params = new URLSearchParams();
    if (catSlug) params.set('category', catSlug);
    setSearchParams(params);
  };

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    else params.delete('minPrice');
    if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
    else params.delete('maxPrice');
    setSearchParams(params);
  };

  const activeCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-full md:w-64 shrink-0">
          <div className="card p-6 sticky top-24">
            <h3 className="font-bold text-surface-900 mb-4">Filters</h3>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-surface-600 mb-3">Category</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                    !selectedCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
                      selectedCategory === cat.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-surface-600 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="min-price" className="text-xs text-surface-500">Min: ₹{priceRange[0]}</label>
                  <input
                    id="min-price"
                    type="range"
                    min={0}
                    max={50000}
                    step={100}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value, 10), priceRange[1]])}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="text-xs text-surface-500">Max: ₹{priceRange[1]}</label>
                  <input
                    id="max-price"
                    type="range"
                    min={0}
                    max={50000}
                    step={100}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                    className="w-full accent-primary-600"
                  />
                </div>
                <button onClick={handlePriceFilter} className="btn-secondary w-full text-sm">
                  Apply Price
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex flex-col mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
                  {activeCategory ? activeCategory.name : 'All Products'}
                </h1>
                {!loading && <p className="text-sm text-surface-500 mt-1">{total} product(s) found</p>}
              </div>
            </div>

            {/* Mobile-only Search and Categories */}
            <div className="md:hidden mt-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchParams.get('q') || ''}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) params.set('q', e.target.value);
                    else params.delete('q');
                    setSearchParams(params);
                  }}
                  className="w-full bg-surface-100 rounded-full py-2 pl-9 pr-4 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Category Chips */}
              <div className="flex flex-nowrap overflow-x-auto gap-2 hide-scrollbar pb-1">
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                  .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                `}</style>
                <button
                  onClick={() => handleCategoryFilter(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[14px] transition-colors ${
                    !selectedCategory ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-800'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`shrink-0 px-4 py-2 rounded-full text-[14px] transition-colors ${
                      selectedCategory === cat.slug ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {page < totalPages && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-primary-600 text-white rounded-full font-medium py-[12px] px-[32px] hover:bg-primary-700 transition-colors flex items-center justify-center min-w-[200px]"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
              {page >= totalPages && total > 12 && (
                <p className="text-center text-sm text-surface-500 mt-8">All products loaded</p>
              )}
            </>
          ) : (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or browse all products."
              action={{ label: 'Clear Filters', onClick: () => setSearchParams({}) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
