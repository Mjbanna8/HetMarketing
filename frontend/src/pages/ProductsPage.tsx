import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import type { Product, Category } from '../types';
import { ProductCard, ProductGridSkeleton, Pagination, EmptyState } from '../components/Shared';

export default function ProductsPage(): React.ReactElement {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const selectedCategory = categorySlug ?? searchParams.get('category') ?? undefined;

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice ?? 0, maxPrice ?? 50000]);

  // Sync priceRange state when URL params change (e.g. after "Clear Filters")
  useEffect(() => {
    setPriceRange([minPrice ?? 0, maxPrice ?? 50000]);
  }, [minPrice, maxPrice]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.getAll({
        category: selectedCategory,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
        page,
        limit: 12,
      });
      if (data.data) {
        setProducts(data.data.items);
        setTotal(data.data.total);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceRange, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    categoriesApi.getAll().then(({ data }) => {
      if (data.data) setCategories(data.data);
    }).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / 12);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleCategoryFilter = (catSlug: string | null) => {
    const params = new URLSearchParams();
    if (catSlug) params.set('category', catSlug);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    else params.delete('minPrice');
    if (priceRange[1] < 50000) params.set('maxPrice', priceRange[1].toString());
    else params.delete('maxPrice');
    params.set('page', '1');
    setSearchParams(params);
  };

  const activeCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
                {activeCategory ? activeCategory.name : 'All Products'}
              </h1>
              {!loading && <p className="text-sm text-surface-500 mt-1">{total} product(s) found</p>}
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
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
