import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import type { UserAdminView, UserDetailAdminView, AdminUserStats } from '../../types';
import { Pagination, Spinner, ConfirmDialog } from '../../components/Shared';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { formatINR, formatDateIST } from '../../utils';

export default function UsersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal states
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; ids: string[]; count: number; name?: string; email?: string }>({ isOpen: false, ids: [], count: 0 });
  const [viewUser, setViewUser] = useState<UserDetailAdminView | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'createdAt' | 'totalOrders'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ search, page, limit: 20 });
      if (data.data) {
        setUsers(data.data.items);
        setTotal(data.data.total);
      }
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, [search, page]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminApi.getUserStats();
      if (data.data) setStats(data.data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle Search Debounce internally or just trigger search on blur/enter? 
  // We'll use a simple timeout debounce for the search input.
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search) params.set('search', search); else params.delete('search');
      params.set('page', '1');
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(handler);
  }, [search, searchParams, setSearchParams]);

  const handleDelete = async () => {
    try {
      if (deleteDialog.count === 1) {
        await adminApi.deleteUser(deleteDialog.ids[0] as string);
        toast.success('User deleted');
      } else {
        await adminApi.bulkDeleteUsers({ ids: deleteDialog.ids });
        toast.success(`${deleteDialog.count} users deleted`);
        setSelectedIds(new Set());
      }
      setDeleteDialog({ isOpen: false, ids: [], count: 0 });
      setViewUser(null);
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user(s)');
    }
  };

  const openDeleteDialog = (user: UserAdminView) => {
    setDeleteDialog({
      isOpen: true,
      ids: [user.id],
      count: 1,
      name: user.fullName,
      email: user.email,
    });
  };

  const openBulkDeleteDialog = () => {
    setDeleteDialog({
      isOpen: true,
      ids: Array.from(selectedIds),
      count: selectedIds.size,
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((u) => u.id)));
  };

  const openViewModal = async (id: string) => {
    setViewLoading(true);
    setViewUser(null); // Clear previous to show loading state nicely if we wanted
    try {
      const { data } = await adminApi.getUserById(id);
      if (data.data) setViewUser(data.data);
    } catch {
      toast.error('Failed to load user details');
    }
    setViewLoading(false);
  };

  const handleSort = (field: 'createdAt' | 'totalOrders') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default to desc
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'createdAt') {
      valA = new Date(valA as string).getTime();
      valB = new Date(valB as string).getTime();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users</h1>
          <p className="text-surface-500 text-sm mt-1">Manage registered customers</p>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-blue-50 text-blue-700 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium opacity-80">Total Users</p>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
          </div>
          <div className="rounded-2xl p-5 bg-green-50 text-green-700 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium opacity-80">New Today</p>
            <p className="text-3xl font-bold mt-1">{stats.newUsersToday}</p>
          </div>
          <div className="rounded-2xl p-5 bg-indigo-50 text-indigo-700 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium opacity-80">With Orders</p>
            <p className="text-3xl font-bold mt-1">{stats.usersWithOrders}</p>
          </div>
          <div className="rounded-2xl p-5 bg-amber-50 text-amber-800 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium opacity-80">No Orders</p>
            <p className="text-3xl font-bold mt-1">{stats.usersNoOrders}</p>
          </div>
        </div>
      )}

      {/* Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center">
        <input 
          type="search" 
          placeholder="Search by name, email, or mobile..." 
          className="input-field max-w-sm text-sm" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <div className="flex items-center gap-3">
          {stats && (
            <span className="bg-surface-100 text-surface-700 text-sm font-medium px-3 py-1 rounded-full">
              {stats.totalUsers} users
            </span>
          )}
          {selectedIds.size > 0 && (
            <div className="flex gap-2 items-center slide-in">
              <span className="text-sm text-surface-500 font-medium">{selectedIds.size} selected</span>
              <button onClick={openBulkDeleteDialog} className="btn-danger text-xs px-3 py-1.5 shadow-sm">
                Bulk Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-surface-800 mb-1">
            {searchParams.get('search') ? `No users match '${searchParams.get('search')}'. Try a different name or email.` : 'No users have registered yet.'}
          </h3>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="py-3 px-4 text-left w-12"><input type="checkbox" checked={selectedIds.size === users.length && users.length > 0} onChange={toggleAll} className="rounded" /></th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Email</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Mobile</th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500 cursor-pointer hover:bg-surface-100 select-none transition-colors" onClick={() => handleSort('createdAt')}>
                      Registered {sortField === 'createdAt' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500 cursor-pointer hover:bg-surface-100 select-none transition-colors" onClick={() => handleSort('totalOrders')}>
                      Orders {sortField === 'totalOrders' && (sortAsc ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-surface-500">Last Order</th>
                    <th className="py-3 px-4 text-right font-medium text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => {
                    const initials = u.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <tr key={u.id} className={`border-b border-surface-50 hover:bg-surface-50 transition-colors ${u.totalOrders === 0 ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-3 px-4"><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" /></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 text-xs">
                              {initials}
                            </div>
                            <span className="font-medium whitespace-nowrap">{u.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 w-48 truncate relative group">
                          {u.email}
                          <span className="absolute left-0 -top-6 bg-surface-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">{u.email}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{u.mobile}</td>
                        <td className="py-3 px-4 text-surface-600 whitespace-nowrap">{formatDistanceToNow(new Date(u.createdAt))} ago</td>
                        <td className="py-3 px-4">
                          {u.totalOrders === 0 ? (
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap">0 orders</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap">{u.totalOrders} orders</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-surface-600 whitespace-nowrap">
                          {u.lastOrderAt ? `${formatDistanceToNow(new Date(u.lastOrderAt))} ago` : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-3 justify-end items-center">
                            <button onClick={() => openViewModal(u.id)} className="text-surface-400 hover:text-primary-600 transition-colors" title="View Details">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => openDeleteDialog(u)} className="text-surface-400 hover:text-red-600 transition-colors" title="Delete User">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={deleteDialog.isOpen} 
        onClose={() => setDeleteDialog({ isOpen: false, ids: [], count: 0 })} 
        onConfirm={handleDelete} 
        title={deleteDialog.count === 1 ? 'Delete user?' : `Delete ${deleteDialog.count} users?`}
        message={deleteDialog.count === 1 
          ? `Are you sure you want to delete ${deleteDialog.name} (${deleteDialog.email})? This will also delete all their orders. This cannot be undone.` 
          : `This will permanently delete ${deleteDialog.count} users and all their order history.`} 
        confirmLabel={deleteDialog.count === 1 ? 'Delete' : 'Delete All'} 
      />

      {/* View Modal */}
      {viewUser || viewLoading ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {viewLoading ? (
               <div className="p-12 flex justify-center"><Spinner size="lg" /></div>
            ) : viewUser && (
              <>
                <div className="p-6 border-b border-surface-200 flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-lg">
                      {viewUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">{viewUser.fullName}</h2>
                      <p className="text-surface-500 text-sm">Registered {formatDateIST(viewUser.createdAt)}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewUser(null)} className="text-surface-400 hover:text-surface-900">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-surface-50 p-3 rounded-lg border border-surface-100">
                      <p className="text-xs text-surface-400 font-medium tracking-wide uppercase">Email Address</p>
                      <p className="font-medium mt-1">{viewUser.email}</p>
                    </div>
                    <div className="bg-surface-50 p-3 rounded-lg border border-surface-100">
                      <p className="text-xs text-surface-400 font-medium tracking-wide uppercase">Mobile Number</p>
                      <p className="font-medium mt-1">{viewUser.mobile}</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-surface-900 mb-3 text-sm tracking-wide uppercase">Order History ({viewUser.orders.length})</h3>
                  
                  {viewUser.orders.length === 0 ? (
                    <div className="p-6 bg-surface-50 rounded-xl text-center text-surface-500">
                      This user has never placed an order.
                    </div>
                  ) : (
                    <div className="border border-surface-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-surface-50 border-b border-surface-200">
                          <tr>
                            <th className="py-2 px-3 font-medium text-surface-500">Order ID</th>
                            <th className="py-2 px-3 font-medium text-surface-500">Product</th>
                            <th className="py-2 px-3 font-medium text-surface-500">Qty</th>
                            <th className="py-2 px-3 font-medium text-surface-500">Price</th>
                            <th className="py-2 px-3 font-medium text-surface-500">Status</th>
                            <th className="py-2 px-3 font-medium text-surface-500">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                          {viewUser.orders.map(o => (
                            <tr key={o.id} className="hover:bg-surface-50">
                              <td className="py-2 px-3 font-mono text-xs">{o.id.slice(-6).toUpperCase()}</td>
                              <td className="py-2 px-3 w-32 truncate" title={o.product.name}>{o.product.name}</td>
                              <td className="py-2 px-3">{o.quantity}</td>
                              <td className="py-2 px-3">{formatINR(o.totalPrice)}</td>
                              <td className="py-2 px-3"><span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-200">{o.status}</span></td>
                              <td className="py-2 px-3 whitespace-nowrap">{formatDateIST(o.createdAt, 'dd MMM y')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-surface-200 bg-surface-50 flex justify-end gap-3 rounded-b-2xl">
                  <button onClick={() => setViewUser(null)} className="btn-secondary px-6">Close</button>
                  <button onClick={() => { openDeleteDialog(viewUser); setViewUser(null); }} className="btn-danger px-6 shadow-sm">Delete User</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
}
