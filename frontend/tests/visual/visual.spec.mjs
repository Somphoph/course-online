import { expect, test } from '@playwright/test';
import { mockApi, setAuthToken } from '../e2e/helpers.mjs';

async function prepareVisualPage(page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}

test('home page looks polished on desktop', async ({ page }) => {
  await mockApi(page);
  await prepareVisualPage(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Learn at your own pace' })).toBeVisible();
  await expect(page).toHaveScreenshot('home-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});

test('admin dashboard feels polished on desktop', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Enrollment Management' })).toBeVisible();
  await expect(page.getByText('Ada Student')).toBeVisible();
  await expect(page).toHaveScreenshot('admin-dashboard-desktop.png', {
    animations: 'disabled',
    caret: 'hide',
  });
});
