'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building, Camera, Global, Call, Sms, Location, Money4, Timer } from 'iconsax-react';
import { studioApi } from '@/libs/endpoints';
import type { Studio, UpdateStudioPayload } from '@/types/api';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/Loader';

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'UZS', 'RUB', 'AED', 'TRY'];
const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Tashkent',
  'Asia/Dubai', 'Asia/Tokyo', 'Asia/Singapore',
];

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

const inputCls =
  'w-full px-3.5 py-2.5 bg-gray-50 border border-black/8 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-gray-400 transition-colors';

export default function StudioSettingsPage() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState<UpdateStudioPayload>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    studioApi
      .get()
      .then((s) => {
        setStudio(s);
        setForm({
          name: s.name,
          address: s.address ?? '',
          city: s.city ?? '',
          state: s.state ?? '',
          zipCode: s.zipCode ?? '',
          country: s.country ?? '',
          email: s.email ?? '',
          phone: s.phone ?? '',
          website: s.website ?? '',
          currency: s.currency ?? 'USD',
          timezone: s.timezone ?? '',
          logoUrl: s.logoUrl ?? '',
        });
      })
      .catch(() => toast.error('Failed to load studio profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof UpdateStudioPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await studioApi.update(form);
      setStudio(updated);
      toast.success('Studio profile saved!');
    } catch {
      toast.error('Failed to save studio profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const { logoUrl } = await studioApi.uploadLogo(file);
      setStudio((prev) => prev ? { ...prev, logoUrl } : prev);
      setForm((prev) => ({ ...prev, logoUrl }));
      toast.success('Logo updated!');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  const logoSrc = studio?.logoUrl ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Logo card */}
      <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Camera size={16} className="text-orange-500" />
          Studio Logo
        </h2>
        <div className="flex items-center gap-5">
          <div
            className="relative w-20 h-20 rounded-2xl bg-gray-100 border border-black/8 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="Studio logo" className="w-full h-full object-cover" />
            ) : (
              <Building size={32} className="text-gray-300" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              {uploadingLogo ? (
                <Loader size="sm" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{studio?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Click logo to change • JPG, PNG, GIF up to 5MB</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Upload new logo
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Main form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* General info */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Building size={16} className="text-orange-500" />
            General Information
          </h2>

          <Field label="Studio Name">
            <input
              required
              value={form.name ?? ''}
              onChange={set('name')}
              placeholder="My Production Studio"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" icon={Sms}>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={set('email')}
                placeholder="hello@studio.com"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" icon={Call}>
              <input
                value={form.phone ?? ''}
                onChange={set('phone')}
                placeholder="+1 555 000 0000"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Website" icon={Global}>
            <input
              value={form.website ?? ''}
              onChange={set('website')}
              placeholder="https://mystudio.com"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Address */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Location size={16} className="text-orange-500" />
            Address
          </h2>
          <Field label="Street Address">
            <input
              value={form.address ?? ''}
              onChange={set('address')}
              placeholder="123 Main Street"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Field label="City">
                <input value={form.city ?? ''} onChange={set('city')} placeholder="New York" className={inputCls} />
              </Field>
            </div>
            <Field label="State / Region">
              <input value={form.state ?? ''} onChange={set('state')} placeholder="NY" className={inputCls} />
            </Field>
            <Field label="ZIP Code">
              <input value={form.zipCode ?? ''} onChange={set('zipCode')} placeholder="10001" className={inputCls} />
            </Field>
          </div>
          <Field label="Country">
            <input value={form.country ?? ''} onChange={set('country')} placeholder="United States" className={inputCls} />
          </Field>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Timer size={16} className="text-orange-500" />
            Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Currency" icon={Money4}>
              <select value={form.currency ?? 'USD'} onChange={set('currency')} className={inputCls}>
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Timezone">
              <select value={form.timezone ?? ''} onChange={set('timezone')} className={inputCls}>
                <option value="">Select timezone</option>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </Field>
          </div>
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
