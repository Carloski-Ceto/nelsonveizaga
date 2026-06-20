import { test, expect } from '@playwright/test';

test('legacy dashboard route redirects and does not remain on legacy URL', async ({ page }) => {
  await page.goto('/dashboard/dashboard');
  await page.waitForLoadState('networkidle');

  expect(page.url()).not.toContain('/dashboard/dashboard');
  expect(page.url()).toMatch(/\/dashboard$|\/login$/);
});

test('dashboard without token redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
});

test('dashboard with token does not redirect to login immediately', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('access_token', 'e2e.fake.access.token');
  });

  await page.goto('/dashboard');
  await page.waitForTimeout(500);
  expect(new URL(page.url()).pathname).toBe('/dashboard');
});
