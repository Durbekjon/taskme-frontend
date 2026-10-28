'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BentoCard } from '@/components/ui/BentoCard';
import { GlassButton } from '@/components/ui/GlassButton';
import Loader from '@/components/ui/Loader';
import { usersApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { useUser } from '@/libs/user-context';

/**
 * The creative's own profile.
 *
 * Every field on this page used to be a hard-coded `defaultValue` ("Alex
 * Rivers", "Lead Videographer") and "Save Changes" did nothing - there was no
 * endpoint behind it. It now reads and writes the real profile.
 */
export default function CreativeProfileSettingsPage() {
  const { user, refresh } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    primaryRole: '',
    primaryGear: '',
    bio: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    usersApi
      .get(user.id)
      .then((profile) => {
        if (cancelled) return;
        setForm({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          primaryRole: profile.workerProfile?.primaryRole ?? '',
          primaryGear: profile.workerProfile?.primaryGear ?? '',
          bio: profile.workerProfile?.bio ?? '',
        });
      })
      .catch((error) => toast.error(apiErrorMessage(error, 'Failed to load your profile')))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        primaryRole: form.primaryRole,
        primaryGear: form.primaryGear,
        bio: form.bio,
      });
      await refresh();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader />
      </div>
    );
  }

  const field = 'field-input';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BentoCard className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-gray-900">Creative Profile</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your details, the work you do, and the gear you shoot on.
            </p>
          </div>
          <GlassButton type="submit" variant="primary" loading={saving}>
            Save changes
          </GlassButton>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="field-label">First name</label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={field}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="field-label">Last name</label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ''}
                className={`${field} bg-gray-50 text-gray-500`}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="creativeId" className="field-label">Creative ID</label>
              <input
                id="creativeId"
                type="text"
                value={user?.workerPublicId ?? '—'}
                className={`${field} bg-gray-50 text-gray-500 font-mono`}
                disabled
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="primaryRole" className="field-label">Professional title</label>
            <input
              id="primaryRole"
              type="text"
              placeholder="Lead Videographer"
              value={form.primaryRole}
              onChange={(e) => setForm({ ...form, primaryRole: e.target.value })}
              className={field}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="primaryGear" className="field-label">Primary gear</label>
            <input
              id="primaryGear"
              type="text"
              placeholder="Sony A7IV, DJI RS3"
              value={form.primaryGear}
              onChange={(e) => setForm({ ...form, primaryGear: e.target.value })}
              className={field}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="field-label">Bio</label>
            <textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      </BentoCard>
    </form>
  );
}
