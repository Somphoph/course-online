import { expect, test } from '@playwright/test';
import { AUTH_TOKEN_KEY, mockApi, setAuthToken } from './helpers.mjs';

test('student login stores a token and redirects to the dashboard', async ({ page }) => {
  await mockApi(page);

  await page.goto('/login');

  await page.getByLabel('Email').fill('student@example.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Your learning space' })).toBeVisible();
  const storedToken = await page.evaluate((key) => window.localStorage.getItem(key), AUTH_TOKEN_KEY);
  expect(storedToken).toBe('student-token');
});

test('admin login redirects into the admin console', async ({ page }) => {
  await mockApi(page);

  await page.goto('/admin/login');

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Sign in to admin' }).click();

  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { name: 'Enrollment Management' })).toBeVisible();
});

test('dashboard redirects anonymous visitors back to login', async ({ page }) => {
  await mockApi(page);

  await page.goto('/dashboard');

  await page.waitForURL('**/login?error=session_expired');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('admin access gate blocks student tokens', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'student-token');

  await page.goto('/admin');

  await page.waitForURL('**/admin/login?error=forbidden');
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Student login' }).first()).toBeVisible();
});
