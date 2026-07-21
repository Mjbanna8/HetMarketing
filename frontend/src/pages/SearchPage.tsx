import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api';
import type { Product } from '../types';
import { ProductCard, ProductGridSkeleton, EmptyState } from '../components/Shared';
import { SEO } from '../components/Shared/SEO';
import { SITE_URL } from '../utils/seoUtils';

export default function SearchPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query.length < 1) { setLoading(false); return; }
    setLoading(true);
    productsApi.search(query).then(({ data }) => {
      if (data.data) setProducts(data.data);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container-page py-8 md:py-12">
      <SEO
        title={query ? `Search: ${query}` : 'Search Products'}
        description="Search the Het Marketing catalog and order your favourites on WhatsApp."
        url={`${SITE_URL}/search`}
      />
      <h1 className="text-2xl md:text-3xl font-bold text-surface-900 mb-2">Search Results</h1>
      {query && <p className="text-surface-500 mb-8">Showing results for &ldquo;{query}&rdquo;</p>}
      {loading ? <ProductGridSkeleton count={8} /> : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <EmptyState title="No results found" message={`We couldn't find any products matching "${query}". Try different keywords.`} action={{ label: 'Browse All Products', href: '/products' }} />
      )}
    </div>
  );
}
