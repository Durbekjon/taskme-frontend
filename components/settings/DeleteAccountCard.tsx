'use client';

import { useState } from 'react';
import { usersApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { useUser } from '@/libs/user-context';

/**
 * In-app account deletion (required by Google's OAuth review and the app
 * stores). Personal data is scrubbed server-side; studio records stay.
 */
export function DeleteAccountCard() {
  const { logout } = useUser();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await usersApi.deleteAccount();
      logout();
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not delete the account. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-red-100 bg-red-50/60 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-gray-900">Delete account</h2>
      <p className="mt-1 text-sm text-gray-600">
        Removes your name, email, phone, photo and Google connection and signs you out everywhere.
        Bookings and payments you were part of stay with the studio, without your details. This cannot be undone.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label htmlFor="confirm-delete" className="field-label">
            Type <b>DELETE</b> to confirm
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="field-input max-w-xs"
            autoComplete="off"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={typed !== 'DELETE' || busy}
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {busy ? 'Deleting…' : 'Permanently delete'}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(false); setTyped(''); setError(''); }}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
