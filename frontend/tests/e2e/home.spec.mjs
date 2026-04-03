import { expect, test } from '@playwright/test';
import { mockApi } from './helpers.mjs';

test('home page shows courses and links into the catalog', async ({ page }) => {
  await mockApi(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Learn at your own pace' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Excel Basics' })).toBeVisible();
  await page.getByText(/THB/).first().waitFor({ state: 'visible' });
});
