import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR, getStatusBadgeColor, getProductStatusLabel } from '../utils';

// --- Spinner ---
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): React.ReactElement {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`${sizeClass} border-2 border-surface-200 border-t-primary-600 rounded-full animate-spin`} />
  );
}

// --- Page Loader ---
export function PageLoader(): React.ReactElement {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-surface-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// --- Skeleton Card ---
export function ProductCardSkeleton(): React.ReactElement {
  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="h-5 skeleton w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// --- Empty State ---
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
}): React.ReactElement {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <div className="text-center max-w-sm animate-fade-in">
        {icon ?? (
          <svg className="w-16 h-16 mx-auto mb-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
        <h3 className="text-lg font-semibold text-surface-900 mb-2">{title}</h3>
        <p className="text-surface-500 text-sm mb-6">{message}</p>
        {action && (
          action.href ? (
            <Link to={action.href} className="btn-primary">{action.label}</Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary">{action.label}</button>
          )
        )}
      </div>
    </div>
  );
}

// --- Product Card ---
export function ProductCard({ product }: { product: Product }): React.ReactElement {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card overflow-hidden group animate-fade-in"
      id={`product-${product.slug}`}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-50">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {discountPercent}% OFF
          </span>
        )}

        {product.status !== 'ACTIVE' && (
          <span className={`absolute top-3 right-3 ${getStatusBadgeColor(product.status)}`}>
            {getProductStatusLabel(product.status)}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-primary-600 font-medium mb-1">{product.category.name}</p>
        <h3 className="font-semibold text-surface-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-surface-900">{formatINR(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-surface-400 line-through">{formatINR(product.originalPrice!)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// --- Pagination ---
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}): React.ReactElement | null {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost px-3 py-2 text-sm"
        aria-label="Previous page"
      >
        ← Prev
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-ghost px-3 py-2 text-sm">1</button>
          {start > 2 && <span className="text-surface-400">...</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[44px] min-h-[44px] ${
            p === page ? 'bg-primary-600 text-white' : 'btn-ghost'
          }`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-surface-400">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-ghost px-3 py-2 text-sm">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost px-3 py-2 text-sm"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}

// --- Status Badge ---
export function StatusBadge({ status }: { status: string }): React.ReactElement {
  return (
    <span className={getStatusBadgeColor(status)}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  );
}

// --- Modal ---
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-surface-100">
          <h2 className="text-xl font-bold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-100 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// --- Confirm Dialog ---
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-surface-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
