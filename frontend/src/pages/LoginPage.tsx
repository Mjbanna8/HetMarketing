import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { Spinner } from '../components/Shared';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  emailOrMobile: z.string().min(1, 'Email or mobile is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(formData);
      if (data.data) {
        setAuth(data.data.user, data.data.accessToken);
        toast.success('Welcome back!');
        navigate(redirect, { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Welcome Back</h1>
          <p className="text-surface-500 mt-2">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="emailOrMobile" className="block text-sm font-medium text-surface-700 mb-2">
                Email or Mobile Number
              </label>
              <input
                id="emailOrMobile"
                type="text"
                className={`input-field ${errors.emailOrMobile ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="you@example.com or +91..."
                {...register('emailOrMobile')}
              />
              {errors.emailOrMobile && (
                <p className="text-red-500 text-sm mt-1">{errors.emailOrMobile.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`input-field ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="Enter your password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
