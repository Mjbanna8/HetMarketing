import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api';
import type { Order } from '../types';
import { useRequireAuth } from '../hooks';
import { formatINR, formatDateIST } from '../utils';
import { StatusBadge, PageLoader, EmptyState } from '../components/Shared';

export default function MyOrdersPage(): React.ReactElement {
  const isAuth = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) return;
    ordersApi.getMy().then(({ data }) => {
      if (data.data) setOrders(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAuth]);

  if (loading) return <PageLoader />;

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold text-surface-900 mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" message="You haven't placed any orders. Start shopping and order via WhatsApp!" action={{ label: 'Browse Products', href: '/products' }} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const img = order.product.images.find((i) => i.isPrimary) ?? order.product.images[0];
            return (
              <Link key={order.id} to={`/order-confirm/${order.id}`} className="card p-4 md:p-6 flex items-center gap-4 hover:border-primary-200 transition-colors">
                {img ? (
                  <img src={img.url} alt={order.product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-surface-900 truncate">{order.product.name}</h3>
                  <p className="text-sm text-surface-500">Qty: {order.quantity} · {formatINR(order.totalPrice)}</p>
                  <p className="text-xs text-surface-400 mt-1">{formatDateIST(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
