import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import type { Order } from '../../types';
import { Pagination, Spinner, EmptyState } from '../../components/Shared';
import { formatINR, formatDateIST, downloadBlob } from '../../utils';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getOrders({ search, from: dateFrom || undefined, to: dateTo || undefined, page, limit: 20 });
      if (data.data) { setOrders(data.data.items); setTotal(data.data.total); }
    } catch { setOrders([]); }
    setLoading(false);
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      toast.success('Order status updated');
      fetchOrders();
    } catch { toast.error('Failed to update status'); }
  };

  const handleExport = async () => {
    try {
      const resp = await adminApi.exportOrders({ from: dateFrom || undefined, to: dateTo || undefined });
      downloadBlob(resp.data as Blob, 'orders.csv');
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Orders</h1>
        <button onClick={handleExport} className="btn-secondary text-sm">📥 Export CSV</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="search" placeholder="Search orders..." className="input-field max-w-xs text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="date" className="input-field max-w-[180px] text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
        <input type="date" className="input-field max-w-[180px] text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" message="No orders match your filters." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Order ID</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Customer</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Mobile</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Product</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Qty</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Total</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Time</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-surface-50 hover:bg-surface-50">
                      <td className="py-3 px-4 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 font-medium">{o.user.fullName}</td>
                      <td className="py-3 px-4 text-surface-500">{o.user.mobile}</td>
                      <td className="py-3 px-4 max-w-[150px] truncate">{o.product.name}</td>
                      <td className="py-3 px-4">{o.quantity}</td>
                      <td className="py-3 px-4 font-medium">{formatINR(o.totalPrice)}</td>
                      <td className="py-3 px-4 text-surface-400 text-xs">{formatDateIST(o.createdAt)}</td>
                      <td className="py-3 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="text-xs rounded-lg border border-surface-200 px-2 py-1 min-h-[36px]"
                          aria-label={`Status for order ${o.id}`}
                        >
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={(p) => { const params = new URLSearchParams(searchParams); params.set('page', p.toString()); setSearchParams(params); }} />
        </>
      )}
    </div>
  );
}
