import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { Spinner } from '../components/Shared';
import toast from 'react-hot-toast';

export default function VerifyOTPPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!userId) {
      toast.error('Invalid verification link');
      navigate('/register', { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ userId: userId!, otp });
      if (data.data) {
        setAuth(data.data.user, data.data.accessToken);
        toast.success('Account verified! Welcome aboard.');
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const { data } = await authApi.resendOtp({ userId: userId! });
      if (data.data) {
        toast.success(data.data.message || 'New OTP sent to your email');
        setCountdown(60);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!userId) return <div />;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Verify Email</h1>
          <p className="text-surface-500 mt-2">Enter the 6-digit code sent to your email</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-surface-700 mb-2 text-center">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="input-field text-center text-2xl tracking-widest font-mono py-3"
                placeholder="000000"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
              {loading ? <Spinner size="sm" /> : 'Verify Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className={`text-sm font-medium ${countdown > 0 ? 'text-surface-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'}`}
            >
              {resending ? 'Sending...' : countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
