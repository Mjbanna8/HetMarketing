import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../api';
import type { Order } from '../types';
import { useRequireAuth } from '../hooks';
import { formatINR, formatDateIST } from '../utils';
import { StatusBadge, PageLoader } from '../components/Shared';

export default function OrderConfirmPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const isAuth = useRequireAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth || !id) return;
    ordersApi.getById(id).then(({ data }) => {
      if (data.data) setOrder(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAuth, id]);

  if (loading) return <PageLoader />;
  if (!order) return <PageLoader />;

  return (
    <div className="container-page py-8 md:py-12">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center animate-scale-in">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 mb-2">Order Placed!</h1>
        <p className="text-surface-500 mb-8">Your order has been sent via WhatsApp. The seller will confirm shortly.</p>

        <div className="card p-6 text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-surface-500">Order ID</span>
            <span className="font-mono text-sm font-medium text-surface-700">{order.id}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-surface-500">Status</span>
            <StatusBadge status={order.status} />
          </div>
          <hr className="border-surface-100 my-4" />
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Product</span>
              <span className="font-medium text-right">{order.product.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Quantity</span>
              <span className="font-medium">{order.quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Unit Price</span>
              <span className="font-medium">{formatINR(order.unitPrice)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-surface-100 pt-3">
              <span>Total</span>
              <span className="text-primary-600">{formatINR(order.totalPrice)}</span>
            </div>
          </div>
          <hr className="border-surface-100 my-4" />
          <div className="space-y-2 text-sm">
            <div><span className="text-surface-500">Address: </span><span className="text-surface-700">{order.deliveryAddress}</span></div>
            {order.customerNote && <div><span className="text-surface-500">Note: </span><span className="text-surface-700">{order.customerNote}</span></div>}
            <div><span className="text-surface-500">Placed: </span><span className="text-surface-700">{formatDateIST(order.createdAt)}</span></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/account/orders" className="btn-primary">View All Orders</Link>
          <Link to="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
