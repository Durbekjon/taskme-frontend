import { test, expect } from '@playwright/test';

/**
 * Route protection.
 *
 * `/admin/*` and `/creative/*` used to render for anyone who typed the URL -
 * there was no middleware and no layout check. These tests pin that down.
 *
 * Run against a dev server: `npm run dev` then `npx playwright test`.
 */

test.describe('unauthenticated visitors', () => {
  for (const path of [
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/finance',
    '/admin/settings/team',
    '/creative/dashboard',
    '/creative/earnings',
    '/onboarding',
  ]) {
    test(`are redirected away from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/(\?error=session_expired)?$/);
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
  }

  test('an expired token is rejected and cleared', async ({ context, page }) => {
    const expired = [
      Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
      Buffer.from(
        JSON.stringify({ sub: 'u1', roles: ['ADMIN'], exp: 1 }),
      ).toString('base64url'),
      'signature',
    ].join('.');

    await context.addCookies([
      { name: 'access_token', value: expired, url: 'http://localhost:3000' },
    ]);

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/error=session_expired/);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'access_token')?.value ?? '').toBe('');
  });
});

test('the login screen is served at the root path', async ({ page }) => {
  // The old spec navigated to `/login`, which is not a route in this app.
  await page.goto('/');
  await expect(page.getByPlaceholder('admin@taskme.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
});
