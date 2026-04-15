import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface MarqueeOffersProps {
  products: Product[];
}

export function MarqueeOffers({ products }: MarqueeOffersProps): React.ReactElement | null {
  if (!products || products.length === 0) return null;

  const renderProductGrid = (prefix: string) => (
    <div className="grid grid-rows-4 grid-flow-col gap-4 pr-4 sm:gap-6 sm:pr-6" aria-hidden={prefix === 'grid2' ? "true" : "false"}>
      {products.map((product, index) => {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const discountPercent = hasDiscount
          ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
          : 0;
        const primaryImage = product.images && product.images.length > 0 
          ? (product.images.find((img) => img.isPrimary) ?? product.images[0]) 
          : null;

        return (
          <Link
            key={`${prefix}-${product.id}-${index}`}
            to={`/products/${product.slug}`}
            className="w-48 sm:w-56 md:w-64 shrink-0 rounded-xl shadow-md overflow-hidden bg-white border border-transparent hover:border-primary-200 transition-all cursor-pointer flex flex-col pointer-events-auto group/card relative z-20"
          >
            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 bg-white/60 backdrop-blur-md border border-white/50 text-surface-900 shadow-sm text-[10px] font-bold px-2 py-0.5 rounded-sm z-30 flex items-center gap-1">
                <span className="text-red-600">{discountPercent}% OFF</span>
              </div>
            )}

            {/* Product Image Placeholder */}
            <div className="relative aspect-[4/3] w-full p-3 flex items-center justify-center">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover/card:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-300 bg-white/20">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 flex flex-col flex-1 bg-white border-t border-surface-50">
              <p className="text-[10px] text-primary-600 font-semibold mb-0.5">{product.category?.name || 'Daily Use'}</p>
              <h3 className="font-semibold text-surface-900 text-xs md:text-sm whitespace-normal line-clamp-2 min-h-[2rem] mb-2 leading-tight group-hover/card:text-primary-600 transition-colors">
                {product.name}
              </h3>

              <div className="flex items-center gap-1.5 mt-auto">
                <span className="text-sm md:text-base font-bold text-surface-900">₹{product.price}</span>
                {hasDiscount && (
                  <span className="text-xs text-surface-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12 md:py-16 overflow-hidden">
      <div className="container-page mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Special Offers</h2>
            <p className="text-surface-500 mt-1">Grab these deals before they're gone</p>
          </div>
          <Link to="/products" className="text-primary-600 font-medium text-sm hover:text-primary-700 transition-colors">
            View All →
          </Link>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative flex w-full group overflow-hidden">
        <div className="flex animate-marquee will-change-transform group-hover:[animation-play-state:paused] w-max relative z-10">
          {renderProductGrid('grid1')}
          {renderProductGrid('grid2')}
        </div>
      </div>
    </section>
  );
}
