/**
 * The one place the access token is read and written.
 *
 * There used to be two spellings - `token` (axios interceptor, onboarding) and
 * `access_token` (login page, fetch helper) - so signing in with email and
 * password stored a token no request ever sent.
 */
export const ACCESS_TOKEN_KEY = 'access_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  // Cookie mirror so Next.js middleware can gate /admin and /creative before
  // any client JavaScript runs. Not httpOnly by design - it holds the same
  // value the page can already read.
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Legacy keys from the old dual-token scheme.
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('refresh_token');
  window.localStorage.removeItem('user_id');
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export interface JwtClaims {
  sub: string;
  email: string;
  roles: string[];
  studioId: string | null;
  exp: number;
}

/** Decodes without verifying - only safe for UI hints, never for authorization. */
export function decodeToken(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: JwtClaims | null): boolean {
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now();
}

/** Where a user belongs right after signing in. */
export function landingPathForRoles(roles: string[] | undefined): string {
  if (roles?.includes('ADMIN')) return '/admin/dashboard';
  if (roles?.includes('CREATIVE')) return '/creative/dashboard';
  return '/onboarding';
}
