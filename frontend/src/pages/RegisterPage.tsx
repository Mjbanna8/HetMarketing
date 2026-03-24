import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { Spinner } from '../components/Shared';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^\+\d{10,15}$/, 'Include country code (e.g., +919999999999)'),
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

type RegisterForm = z.infer<typeof registerSchema>;

const countryCodeOptions = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+971', country: 'AE' },
  { code: '+65', country: 'SG' },
];

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const mobileValue = watch('mobile');
  const passwordValue = watch('password') || '';

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    if (hasLetters) score = 1;
    if (hasLetters && hasNumbers) score = 2;
    if (hasLetters && hasNumbers && (hasUpper || hasSpecial)) score = 3;
    if (hasUpper && hasLower && hasNumbers && hasSpecial && pass.length >= 8) score = 4;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setValue('mobile', countryCode + raw, { shouldValidate: true });
  };

  const onSubmit = async (formData: RegisterForm) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(formData);
      if (data.data) {
        toast.success(data.data.message || 'OTP sent to your email.');
        navigate(`/verify-otp?userId=${data.data.userId}`, { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Create Account</h1>
          <p className="text-surface-500 mt-2">Join us and start shopping</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-2">Full Name</label>
              <input id="fullName" type="text" className={`input-field ${errors.fullName ? 'border-red-400' : ''}`} placeholder="Your full name" {...register('fullName')} />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">Email</label>
              <input id="email" type="email" className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-surface-700 mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    if (mobileValue) {
                      const raw = mobileValue.replace(/^\+\d+/, '');
                      setValue('mobile', e.target.value + raw, { shouldValidate: true });
                    }
                  }}
                  className="input-field w-24 shrink-0"
                  aria-label="Country code"
                >
                  {countryCodeOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.code} {opt.country}</option>
                  ))}
                </select>
                <input
                  id="mobile"
                  type="tel"
                  className={`input-field flex-1 ${errors.mobile ? 'border-red-400' : ''}`}
                  placeholder="9999999999"
                  onChange={handleMobileChange}
                />
              </div>
              {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-surface-700 mb-2">Password</label>
              <input id="register-password" type="password" className={`input-field ${errors.password ? 'border-red-400' : ''}`} placeholder="Min 8 chars, uppercase, number, special" {...register('password')} />
              
              {passwordValue.length > 0 && (
                <div className="mt-2 flex gap-1 h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${strength >= 1 ? (strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                  <div className={`h-full transition-all ${strength >= 2 ? (strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                  <div className={`h-full transition-all ${strength >= 3 ? (strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                  <div className={`h-full transition-all ${strength >= 4 ? 'bg-green-600' : 'bg-transparent'} w-1/4`} />
                </div>
              )}
              {passwordValue.length > 0 && (
                <p className="text-xs text-surface-500 mt-1">
                  {strength === 1 && 'Weak (add numbers/symbols)'}
                  {strength === 2 && 'Fair (add uppercase/symbols)'}
                  {strength === 3 && 'Good (add remaining rules)'}
                  {strength === 4 && 'Strong password'}
                </p>
              )}
              
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-2">Confirm Password</label>
              <input id="confirmPassword" type="password" className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`} placeholder="Re-enter your password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
