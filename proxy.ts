import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection.
 *
 * `/admin` and `/creative` used to render for anyone who typed the URL - there
 * was no middleware and the layouts did not check anything. The token is read
 * from a cookie mirror written by `libs/session.ts`.
 *
 * This is a UX gate, not a security boundary: the JWT signature is verified by
 * the API on every request, which is what actually protects the data.
 */

const ACCESS_TOKEN_COOKIE = 'access_token';

interface Claims {
  roles?: string[];
  exp?: number;
}

function readClaims(token: string): Claims | null {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    // atob is available in the Edge runtime.
    return JSON.parse(atob(normalized)) as Claims;
  } catch {
    return null;
  }
}

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const claims = token ? readClaims(token) : null;
  const expired = !claims?.exp || claims.exp * 1000 <= Date.now();
  const roles = claims?.roles ?? [];

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/creative') ||
    pathname.startsWith('/onboarding');

  if (isProtected && (!token || expired)) {
    const response = redirect(request, '/?error=session_expired');
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    return response;
  }

  if (!expired) {
    // Signed-in users should not sit on the login screen.
    if (pathname === '/') {
      if (roles.includes('ADMIN')) return redirect(request, '/admin/dashboard');
      if (roles.includes('CREATIVE')) return redirect(request, '/creative/dashboard');
      return redirect(request, '/onboarding');
    }
    if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
      return redirect(
        request,
        roles.includes('CREATIVE') ? '/creative/dashboard' : '/onboarding',
      );
    }
    if (pathname.startsWith('/creative') && !roles.includes('CREATIVE')) {
      return redirect(
        request,
        roles.includes('ADMIN') ? '/admin/dashboard' : '/onboarding',
      );
    }
    // Onboarding is only for users who have not picked a role yet.
    if (
      pathname.startsWith('/onboarding') &&
      (roles.includes('ADMIN') || roles.includes('CREATIVE'))
    ) {
      return redirect(
        request,
        roles.includes('ADMIN') ? '/admin/dashboard' : '/creative/dashboard',
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/creative/:path*', '/onboarding/:path*'],
};
