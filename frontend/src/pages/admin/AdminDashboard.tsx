import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import type { DashboardMetrics, ChartData, Product } from '../../types';
import { Spinner } from '../../components/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatDateIST } from '../../utils';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const REFRESH_INTERVAL_MS = 30_000; // 30-second auto-refresh

export default function AdminDashboard(): React.ReactElement {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [metricsRes, chartRes, productsRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getChart(30),
        adminApi.getProducts({ limit: 5, sort: 'createdAt:desc' }),
      ]);
      if (metricsRes.data.data) setMetrics(metricsRes.data.data);
      if (chartRes.data.data) setChartData(chartRes.data.data);
      if (productsRes.data.data) setLatestProducts(productsRes.data.data.items);
      setLastRefreshed(new Date());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-400">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => loadData(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-medium hover:bg-primary-100 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Products', value: metrics.totalProducts, color: 'bg-blue-50 text-blue-700', link: '/admin/products' },
            { label: 'Categories', value: metrics.totalCategories, color: 'bg-green-50 text-green-700', link: '/admin/categories' },
            { label: 'Total Orders', value: metrics.totalOrders, color: 'bg-purple-50 text-purple-700', link: '/admin/orders' },
            { label: 'Orders Today', value: metrics.ordersToday, color: 'bg-amber-50 text-amber-700', link: '/admin/orders' },
            { label: 'Out of Stock', value: metrics.outOfStockCount, color: 'bg-red-50 text-red-700', link: '/admin/products?status=OUT_OF_STOCK' },
            { label: 'Registered Users', value: metrics.totalUsers, color: 'bg-teal-50 text-teal-700', link: '/admin/users' },
          ].map((card) => (
            <Link key={card.label} to={card.link} className={`rounded-2xl p-5 ${card.color} hover:shadow-md transition-shadow`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Volume Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Daily Orders (Last 30 Days)</h3>
          {chartData?.orderChart && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.orderChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value, 'Orders']} labelFormatter={(label: string) => `Date: ${label}`} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Products by Category</h3>
          {chartData?.categoryChart && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.categoryChart}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartData.categoryChart.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Latest Products */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-900">Recently Added Products</h3>
          <Link to="/admin/products" className="text-sm text-primary-600 font-medium">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left py-3 px-4 font-medium text-surface-500">Product</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Category</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Price</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {latestProducts.map((p) => (
                <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 text-surface-500">{p.category.name}</td>
                  <td className="py-3 px-4">₹{p.price}</td>
                  <td className="py-3 px-4 text-surface-400">{formatDateIST(p.createdAt, 'dd MMM')}</td>
                  <td className="py-3 px-4"><Link to={`/admin/products/${p.id}/edit`} className="text-primary-600 font-medium">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
