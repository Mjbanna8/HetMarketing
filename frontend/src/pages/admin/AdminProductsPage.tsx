import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import type { Product } from '../../types';
import { StatusBadge, Pagination, Spinner, EmptyState, ConfirmDialog } from '../../components/Shared';
import { formatINR, formatDateShort, downloadBlob } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminProductsPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const isTrash = searchParams.get('view') === 'trash';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchFn = isTrash ? adminApi.getTrashProducts : adminApi.getProducts;
      const { data } = await fetchFn({ search, page, limit: 20 });
      if (data.data) { setProducts(data.data.items); setTotal(data.data.total); }
    } catch { setProducts([]); }
    setLoading(false);
  }, [search, page, isTrash]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (val: string) => {
    setSearch(val);
    const params = new URLSearchParams(searchParams);
    if (val) params.set('search', val); else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (isTrash) {
        await adminApi.hardDeleteProduct(deleteId);
        toast.success('Product permanently deleted');
      } else {
        await adminApi.deleteProduct(deleteId);
        toast.success('Product moved to trash');
      }
      setDeleteId(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleRestore = async (id: string) => {
    try {
      await adminApi.restoreProduct(id);
      toast.success('Product restored');
      fetchProducts();
    } catch { toast.error('Failed to restore'); }
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await adminApi.bulkAction({ ids: Array.from(selectedIds), action });
      toast.success(`${selectedIds.size} product(s) updated`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch { toast.error('Bulk action failed'); }
    setBulkLoading(false);
  };

  const handleExport = async () => {
    try {
      const resp = await adminApi.exportProducts();
      downloadBlob(resp.data as Blob, 'products.csv');
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-surface-900">{isTrash ? 'Trash' : 'Products'}</h1>
        <div className="flex gap-2 flex-wrap">
          {!isTrash ? (
            <>
              <Link to="/admin/products/add" className="btn-primary text-sm">+ Add Product</Link>
              <button onClick={() => { const p = new URLSearchParams(searchParams); p.set('view', 'trash'); setSearchParams(p); }} className="btn-secondary text-sm">🗑️ Trash</button>
              <button onClick={handleExport} className="btn-secondary text-sm">📥 Export CSV</button>
            </>
          ) : (
            <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('view'); setSearchParams(p); }} className="btn-secondary text-sm">← Back to Products</button>
          )}
        </div>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input type="search" placeholder="Search products..." className="input-field max-w-xs text-sm" value={search} onChange={(e) => handleSearch(e.target.value)} />
        {selectedIds.size > 0 && !isTrash && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-surface-500">{selectedIds.size} selected</span>
            <button onClick={() => handleBulkAction('delete')} className="btn-danger text-xs" disabled={bulkLoading}>{bulkLoading ? <Spinner size="sm" /> : 'Delete'}</button>
            <button onClick={() => handleBulkAction('activate')} className="btn-secondary text-xs" disabled={bulkLoading}>Activate</button>
            <button onClick={() => handleBulkAction('deactivate')} className="btn-secondary text-xs" disabled={bulkLoading}>Deactivate</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState title={isTrash ? 'Trash is empty' : 'No products yet'} message={isTrash ? 'No deleted products found.' : 'Add your first product to get started.'} action={isTrash ? undefined : { label: 'Add Product', href: '/admin/products/add' }} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="py-3 px-4 text-left"><input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleAll} className="rounded" /></th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Image</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Category</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Price</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Date</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
                    return (
                      <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50">
                        <td className="py-3 px-4"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" /></td>
                        <td className="py-3 px-4">{img ? <img src={img.url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/999?text=No+Image'; }} /> : <div className="w-10 h-10 rounded-lg bg-surface-100" />}</td>
                        <td className="py-3 px-4 font-medium max-w-[200px] truncate">{p.name}</td>
                        <td className="py-3 px-4 text-surface-500">{p.category.name}</td>
                        <td className="py-3 px-4">{formatINR(p.price)}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                        <td className="py-3 px-4 text-surface-400">{formatDateShort(p.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {isTrash ? (
                              <>
                                <button onClick={() => handleRestore(p.id)} className="text-primary-600 text-xs font-medium">Restore</button>
                                <button onClick={() => setDeleteId(p.id)} className="text-red-600 text-xs font-medium">Delete Forever</button>
                              </>
                            ) : (
                              <>
                                <Link to={`/admin/products/${p.id}/edit`} className="text-primary-600 text-xs font-medium">Edit</Link>
                                <button onClick={() => setDeleteId(p.id)} className="text-red-600 text-xs font-medium">Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={(p) => { const params = new URLSearchParams(searchParams); params.set('page', p.toString()); setSearchParams(params); }} />
        </>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={isTrash ? 'Delete Permanently?' : 'Move to Trash?'} message={isTrash ? 'This product will be permanently deleted and cannot be recovered.' : 'This product will be moved to trash. You can restore it within 30 days.'} confirmLabel={isTrash ? 'Delete Forever' : 'Move to Trash'} />
    </div>
  );
}
