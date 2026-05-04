import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { Spinner } from '../components/Shared';

const COUNTRY_CODES = ['+91', '+1', '+44'] as const;

const PHONE_RULES: Record<(typeof COUNTRY_CODES)[number], { minLength: number; maxLength: number; label: string }> = {
  '+91': { minLength: 10, maxLength: 10, label: 'India' },
  '+1': { minLength: 10, maxLength: 10, label: 'United States / Canada' },
  '+44': { minLength: 10, maxLength: 11, label: 'United Kingdom' },
};

const DEFAULT_COUNTRY_CODE = '+91' as const;

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(60, 'Full name must be at most 60 characters').regex(/^[a-zA-Z\s]+$/, 'Name must contain letters only').trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  countryCode: z.enum(COUNTRY_CODES),
  phoneNumber: z.string().trim().regex(/^\d+$/, 'Phone number must contain digits only'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  const rules = PHONE_RULES[data.countryCode];

  if (data.phoneNumber.length < rules.minLength || data.phoneNumber.length > rules.maxLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phoneNumber'],
      message: `${rules.label} phone numbers must be ${rules.minLength}${rules.minLength === rules.maxLength ? '' : `-${rules.maxLength}`} digits long`,
    });
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
});

type RegisterForm = z.infer<typeof registerSchema>;
type Step = 'form' | 'otp';

function getApiError(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { error?: string; message?: string } } };
  return error.response?.data?.error ?? error.response?.data?.message ?? fallback;
}

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, control, handleSubmit, formState: { errors }, watch, getValues } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      countryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';
  const emailValue = watch('email');
  const selectedCountryCode = watch('countryCode') || DEFAULT_COUNTRY_CODE;
  const selectedPhoneRules = PHONE_RULES[selectedCountryCode as keyof typeof PHONE_RULES];

  const buildMobileNumber = (values: RegisterForm): string => `${values.countryCode}${values.phoneNumber}`;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const clearResendTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startResendTimer = () => {
    clearResendTimer();
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearResendTimer();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;

    if (pass.length < 8) return 1;
    if (pass.length < 10) return 2;
    if (pass.length < 12) return 3;
    return 4;
  };

  const strength = getPasswordStrength(passwordValue);

  const handleSendOtp = async (formData: RegisterForm) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await authApi.sendRegisterOtp({
        fullName: formData.fullName,
        email: formData.email,
        mobile: buildMobileNumber(formData),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (data.data) {
        setStep('otp');
        setWhatsappLink(data.data.whatsappLink);
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        toast.success(data.data.message || 'OTP sent to your email.');
      }
    } catch (err: unknown) {
      const message = getApiError(err, 'Registration failed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');

    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (text.length === 6) {
      setOtp(text.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const values = getValues();
      const { data } = await authApi.verifyRegisterOtp({
        fullName: values.fullName,
        email: values.email,
        mobile: buildMobileNumber(values),
        password: values.password,
        otp: otpValue,
      });

      if (data.data) {
        toast.success(data.data.message || 'Account created successfully.');
        navigate('/login?registered=true');
      }
    } catch (err: unknown) {
      const message = getApiError(err, 'Invalid OTP. Please try again.');
      setError(message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setError('');

    try {
      const values = getValues();
      const { data } = await authApi.resendRegisterOtp({
        email: values.email,
        mobile: buildMobileNumber(values),
      });

      if (data.data) {
        setWhatsappLink(data.data.whatsappLink);
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        otpRefs.current[0]?.focus();
        toast.success(data.data.message || 'OTP resent successfully.');
      }
    } catch (err: unknown) {
      const message = getApiError(err, 'Failed to resend OTP.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Create Account</h1>
          <p className="text-surface-500 mt-2">
            {step === 'form' ? 'Join us and start shopping' : 'Verify your email to continue'}
          </p>
        </div>

        <div className="card p-8">
          {step === 'form' && (
            <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-5">
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
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-surface-700 mb-2">Mobile Number</label>
                <div className={`flex rounded-lg border bg-white shadow-sm transition-colors ${errors.countryCode || errors.phoneNumber ? 'border-red-400' : 'border-surface-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100'}`}>
                  <Controller
                    control={control}
                    name="countryCode"
                    render={({ field }) => (
                      <select
                        id="countryCode"
                        {...field}
                        className="w-28 md:w-32 flex-none border-0 bg-transparent px-3 py-3 text-sm font-medium text-surface-700 outline-none focus:ring-0"
                        aria-label="Country code"
                      >
                        {COUNTRY_CODES.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <div className="w-px bg-surface-200" aria-hidden="true" />
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <input
                        id="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={selectedPhoneRules.maxLength}
                        placeholder={selectedCountryCode === '+91' ? '9876543210' : 'Enter phone number'}
                        className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-surface-900 outline-none placeholder:text-surface-400 focus:ring-0 ${errors.phoneNumber ? 'text-red-600' : ''}`}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, selectedPhoneRules.maxLength))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-surface-500">
                  <p>Digits only. Selected format starts with {selectedCountryCode}.</p>
                  <p>{selectedPhoneRules.label}</p>
                </div>
                {errors.countryCode && <p className="text-red-500 text-sm mt-1">{errors.countryCode.message}</p>}
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-surface-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pr-11 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
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

                {passwordValue.length > 0 && (
                  <>
                    <div className="mt-2 flex gap-1 h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${strength >= 1 ? (strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full transition-all ${strength >= 2 ? (strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full transition-all ${strength >= 3 ? (strength === 3 ? 'bg-green-400' : 'bg-green-600') : 'bg-transparent'} w-1/4`} />
                      <div className={`h-full transition-all ${strength >= 4 ? 'bg-green-600' : 'bg-transparent'} w-1/4`} />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">
                      {strength === 1 && 'Short password'}
                      {strength === 2 && 'Good start'}
                      {strength === 3 && 'Strong length'}
                      {strength === 4 && 'Strong password'}
                    </p>
                  </>
                )}

                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input-field pr-11 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                    placeholder="Re-enter your password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-surface-400 hover:text-surface-700 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Send OTP'}
              </button>

              <p className="text-center text-sm text-surface-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-sm text-surface-500">We sent a 6-digit OTP to</p>
                <p className="font-medium text-surface-900">{emailValue}</p>
              </div>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Also check WhatsApp
                </a>
              )}

              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    className="w-11 h-12 text-center text-lg font-semibold border border-surface-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-colors"
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={loading || otp.join('').length !== 6}>
                {loading ? <Spinner size="sm" /> : 'Verify & Create Account'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    clearResendTimer();
                    setStep('form');
                    setError('');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="text-surface-500 hover:text-surface-700 font-medium"
                >
                  Change details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-primary-600 hover:text-primary-700 font-medium disabled:text-surface-400 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <p className="text-center text-sm text-surface-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}