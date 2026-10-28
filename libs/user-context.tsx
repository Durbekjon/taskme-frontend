'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './endpoints';
import { clearToken, getToken } from './session';
import type { AuthUser } from '@/types/api';

/**
 * One fetch of the current user per session, shared through context.
 *
 * The old `useUser` hook ran its own `fetch` in every component that called
 * it - AppShell plus each page - so a single navigation hit `/users/:id`
 * two or three times, unauthenticated, relying on that route being public.
 */

interface UserContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  // Must not depend on localStorage: the server renders without it, so
  // seeding this from the token produced a hydration mismatch.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /** Loads the signed-in user. Callers must hold a token. */
  const refresh = useCallback(async () => {
    try {
      setUser(await authApi.me());
      setError(null);
    } catch (err) {
      // A 401 is already handled by the axios interceptor.
      setUser(null);
      setError(err instanceof Error ? err : new Error('Failed to load user'));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.replace('/');
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, error, refresh, logout }),
    [user, loading, error, refresh, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside <UserProvider>');
  }
  return context;
}

/** Convenience for the many places that render "Firstname Lastname". */
export function displayName(user: Pick<AuthUser, 'firstName' | 'lastName' | 'email'> | null): string {
  if (!user) return '';
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || user.email;
}
