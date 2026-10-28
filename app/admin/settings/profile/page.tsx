'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Call, Sms, Location, Briefcase, Setting2 } from 'iconsax-react';
import { usersApi } from '@/libs/endpoints';
import { useUser, displayName } from '@/libs/hooks/useUser';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/Loader';

const inputCls =
  'w-full px-3.5 py-2.5 bg-gray-50 border border-black/8 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-gray-400 transition-colors';

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {Icon && <Icon size={12} className="text-gray-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { user, refresh } = useUser();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    primaryRole: '',
    primaryGear: '',
    bio: '',
    city: '',
  });

  // Sync form if user loads after mount
  const [synced, setSynced] = useState(false);
  if (user && !synced) {
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      primaryRole: '',
      primaryGear: '',
      bio: '',
      city: '',
    });
    setSynced(true);
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await usersApi.updateMe(form);
      await refresh();
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      await usersApi.uploadAvatar(file);
      await refresh();
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  const avatarSrc = user.avatarUrl ?? null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Avatar card */}
      <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Camera size={16} className="text-orange-500" />
          Profile Picture
        </h2>
        <div className="flex items-center gap-5">
          <div
            className="relative w-20 h-20 rounded-2xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-400">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              {uploadingAvatar ? <Loader size="sm" /> : <Camera size={20} className="text-white" />}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{displayName(user)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Click to change • JPG, PNG, GIF up to 5MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* Main form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal info */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <User size={16} className="text-orange-500" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="Aziz"
                className={inputCls}
              />
            </Field>
            <Field label="Last Name">
              <input
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="Karimov"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="City" icon={Location}>
            <input
              value={form.city}
              onChange={set('city')}
              placeholder="Tashkent"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Account info (read-only) */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Setting2 size={16} className="text-orange-500" />
            Account
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" icon={Sms}>
              <input
                value={user.email}
                readOnly
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </Field>
            <Field label="Account Type" icon={Call}>
              <input
                value={user.accountType ?? '—'}
                readOnly
                className={`${inputCls} opacity-60 cursor-not-allowed capitalize`}
              />
            </Field>
          </div>
        </div>

        {/* Worker fields (if studio account, still show for owner) */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={16} className="text-orange-500" />
            Professional Info
          </h2>

          <Field label="Primary Role">
            <input
              value={form.primaryRole}
              onChange={set('primaryRole')}
              placeholder="Lead Videographer"
              className={inputCls}
            />
          </Field>

          <Field label="Primary Gear">
            <input
              value={form.primaryGear}
              onChange={set('primaryGear')}
              placeholder="Sony A7IV, DJI RS3"
              className={inputCls}
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell us about yourself..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader size="sm" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
