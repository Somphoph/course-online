import { expect, test } from '@playwright/test';
import { mockApi, setAuthToken } from '../e2e/helpers.mjs';

test('home page looks polished on desktop', async ({ page }) => {
  await mockApi(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Learn at your own pace' })).toBeVisible();
  await expect(page).toHaveScreenshot('home-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});

test('student login layout is stable', async ({ page }) => {
  await mockApi(page);

  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page).toHaveScreenshot('login-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});

test('admin login layout is stable', async ({ page }) => {
  await mockApi(page);

  await page.goto('/admin/login');

  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page).toHaveScreenshot('admin-login-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});

test('admin dashboard keeps its table layout balanced', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Enrollment Management' })).toBeVisible();
  await expect(page.getByText('Ada Student')).toBeVisible();
  await expect(page).toHaveScreenshot('admin-dashboard-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});
