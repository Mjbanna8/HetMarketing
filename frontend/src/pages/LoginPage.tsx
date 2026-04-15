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
  const [showPassword, setShowPassword] = useState(false);

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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pr-11 ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-surface-400 hover:text-surface-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
