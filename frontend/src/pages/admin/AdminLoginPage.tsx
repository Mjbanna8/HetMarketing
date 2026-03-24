import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api';
import { useAdminAuthStore } from '../../store';
import { Spinner } from '../../components/Shared';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (formData: Form) => {
    setLoading(true);
    try {
      const { data } = await authApi.adminLogin(formData);
      if (data.data) {
        setAuth(data.data.admin, data.data.accessToken);
        toast.success('Welcome, Admin!');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Admin Login</h1>
          <p className="text-surface-500 mt-2 text-sm">Sign in to the admin panel</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-surface-700 mb-2">Email</label>
            <input id="admin-email" type="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="admin@store.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-surface-700 mb-2">Password</label>
            <input id="admin-password" type="password" className={`input-field ${errors.password ? 'border-red-400' : ''}`} placeholder="Enter password" {...register('password')} />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
