import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { Spinner } from '../components/Shared';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (formData: ResetForm) => {
    if (!token) return;
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password: formData.password, confirmPassword: formData.confirmPassword });
      toast.success('Password reset successfully!');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Reset Password</h1>
          <p className="text-surface-500 mt-2">Enter your new password</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-surface-700 mb-2">New Password</label>
              <input id="new-password" type="password" className={`input-field ${errors.password ? 'border-red-400' : ''}`} placeholder="Min 8 chars, uppercase, number, special" {...register('password')} />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-surface-700 mb-2">Confirm New Password</label>
              <input id="confirm-new-password" type="password" className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`} placeholder="Re-enter your new password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Reset Password'}
            </button>
          </form>
          <p className="text-center text-sm text-surface-500 mt-6">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
