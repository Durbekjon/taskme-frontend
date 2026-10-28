import {
  ACCESS_TOKEN_KEY,
  clearToken,
  decodeToken,
  getToken,
  isExpired,
  landingPathForRoles,
  setToken,
} from '@/libs/session';

/** Builds an unsigned JWT-shaped string; only the payload matters here. */
function makeToken(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}

describe('session', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads back the token it wrote under a single key', () => {
    const token = makeToken({ sub: 'u1', roles: ['ADMIN'] });
    setToken(token);
    expect(getToken()).toBe(token);
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe(token);
  });

  it('mirrors the token into a cookie so the route proxy can read it', () => {
    setToken(makeToken({ sub: 'u1' }));
    expect(document.cookie).toContain(ACCESS_TOKEN_KEY);
  });

  it('clears the legacy keys left over from the old dual-token scheme', () => {
    window.localStorage.setItem('token', 'legacy');
    window.localStorage.setItem('refresh_token', 'legacy');
    window.localStorage.setItem('user_id', 'legacy');
    setToken(makeToken({ sub: 'u1' }));

    clearToken();

    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('refresh_token')).toBeNull();
    expect(window.localStorage.getItem('user_id')).toBeNull();
  });

  it('decodes claims and detects expiry', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const past = Math.floor(Date.now() / 1000) - 10;

    expect(decodeToken(makeToken({ sub: 'u1', exp: future }))?.sub).toBe('u1');
    expect(isExpired(decodeToken(makeToken({ exp: future })))).toBe(false);
    expect(isExpired(decodeToken(makeToken({ exp: past })))).toBe(true);
    expect(isExpired(decodeToken('not-a-token'))).toBe(true);
  });

  it('routes each role to its own landing page', () => {
    // The API returns `roles` as an array; the login page used to branch on a
    // singular `user.role` that never existed.
    expect(landingPathForRoles(['ADMIN'])).toBe('/admin/dashboard');
    expect(landingPathForRoles(['CREATIVE'])).toBe('/creative/dashboard');
    expect(landingPathForRoles(['USER'])).toBe('/onboarding');
    expect(landingPathForRoles(undefined)).toBe('/onboarding');
  });
});
