import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api';
import type { User } from '../../types';
import { Spinner, Pagination } from '../../components/Shared';
import { formatDateIST } from '../../utils';

interface AdminUser extends User {
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage(): React.ReactElement {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ search: search || undefined, page, limit: 20 });
      if (data.data) {
        setUsers(data.data.items as AdminUser[]);
        setTotal(data.data.total);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users</h1>
          <p className="text-surface-500 text-sm mt-1">{total} registered user(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-md"
        />
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-surface-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Mobile</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-surface-900">{u.fullName}</td>
                    <td className="py-3 px-4 text-surface-600">{u.email}</td>
                    <td className="py-3 px-4 text-surface-600">{u.mobile}</td>
                    <td className="py-3 px-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-surface-400">{formatDateIST(u.createdAt, 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
