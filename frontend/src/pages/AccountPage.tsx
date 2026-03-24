import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { useRequireAuth } from '../hooks';
import { Spinner, PageLoader } from '../components/Shared';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^\+\d{10,15}$/, 'Include country code').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Uppercase required').regex(/[0-9]/, 'Number required').regex(/[^A-Za-z0-9]/, 'Special char required').optional().or(z.literal('')),
}).refine((d) => { if (d.newPassword && !d.currentPassword) return false; return true; }, { message: 'Current password required', path: ['currentPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;

export default function AccountPage(): React.ReactElement {
  const isAuth = useRequireAuth();
  const { user, setUser, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '', mobile: user?.mobile ?? '' },
  });

  if (isLoading || !isAuth) return <PageLoader />;

  const onSubmit = async (formData: ProfileForm) => {
    setLoading(true);
    try {
      const updateData: Record<string, string | undefined> = {};
      if (formData.fullName && formData.fullName !== user?.fullName) updateData.fullName = formData.fullName;
      if (formData.mobile && formData.mobile !== user?.mobile) updateData.mobile = formData.mobile;
      if (formData.currentPassword) updateData.currentPassword = formData.currentPassword;
      if (formData.newPassword) updateData.newPassword = formData.newPassword;

      const { data } = await authApi.updateProfile(updateData);
      if (data.data) {
        setUser(data.data);
        reset({ fullName: data.data.fullName, mobile: data.data.mobile, currentPassword: '', newPassword: '' });
        toast.success('Profile updated successfully');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold text-surface-900 mb-8">My Account</h1>
      <div className="max-w-lg">
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-surface-700 mb-2">Full Name</label>
              <input id="profile-name" type="text" className="input-field" {...register('fullName')} />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Email</label>
              <input type="email" className="input-field bg-surface-50" value={user?.email ?? ''} disabled />
              <p className="text-xs text-surface-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label htmlFor="profile-mobile" className="block text-sm font-medium text-surface-700 mb-2">Mobile</label>
              <input id="profile-mobile" type="tel" className="input-field" {...register('mobile')} />
              {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
            </div>
            <hr className="border-surface-100" />
            <p className="text-sm font-semibold text-surface-700">Change Password</p>
            <div>
              <label htmlFor="current-pw" className="block text-sm font-medium text-surface-700 mb-2">Current Password</label>
              <input id="current-pw" type="password" className="input-field" placeholder="Required to change password" {...register('currentPassword')} />
              {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>}
            </div>
            <div>
              <label htmlFor="new-pw" className="block text-sm font-medium text-surface-700 mb-2">New Password</label>
              <input id="new-pw" type="password" className="input-field" placeholder="Leave blank to keep current" {...register('newPassword')} />
              {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
