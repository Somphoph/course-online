import { expect, test } from '@playwright/test';
import { mockApi, setAuthToken } from './helpers.mjs';

test('admin page renders pending enrollments and supports approval', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Enrollment Management' })).toBeVisible();
  await expect(page.getByText('Ada Student')).toBeVisible();

  await page.getByRole('button', { name: 'Approve' }).click();

  await expect(page.getByText('No pending enrollments')).toBeVisible();
});
