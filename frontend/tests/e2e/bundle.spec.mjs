import { expect, test } from '@playwright/test';
import { mockApi, setAuthToken, fixtures } from './helpers.mjs';

test('bundles page shows published bundles with savings', async ({ page }) => {
  await mockApi(page);

  await page.goto('/bundles');

  await expect(page.getByRole('heading', { name: 'Bundles & Packages' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Office Power Suite/ })).toBeVisible();
  await expect(page.getByText(/Save \d+ THB/)).toBeVisible();
});

test('bundle detail page shows courses and purchase link', async ({ page }) => {
  await mockApi(page);

  await page.goto('/bundles/1');

  await expect(page.getByRole('heading', { name: /Office Power Suite/ })).toBeVisible();
  await expect(page.getByText(/Bundle price/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy this bundle' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Included courses' })).toBeVisible();
});

test('bundle purchase page requires authentication', async ({ page }) => {
  await mockApi(page);

  await page.goto('/bundles/1/purchase');

  await page.waitForURL('**/login**');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('bundle purchase page shows payment method options when authenticated', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'student-token');

  await page.goto('/bundles/1/purchase');

  await expect(page.getByRole('heading', { name: 'Purchase the full bundle' })).toBeVisible();
  await expect(page.getByText('Bank transfer slip')).toBeVisible();
  await expect(page.getByText('PromptPay via PaySolution')).toBeVisible();
});

test('admin bundles page shows bundle list and create button', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin/bundles');

  await expect(page.getByRole('heading', { name: 'Bundles' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Bundle' })).toBeVisible();
  await expect(page.getByText(/Office Power Suite/)).toBeVisible();
});

test('admin bundle enrollments page shows pending purchases', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin/bundle-enrollments');

  await expect(page.getByRole('heading', { name: 'Bundle Purchase Management' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
  await expect(page.getByText('Ada Student')).toBeVisible();
});

test('admin can approve bundle enrollment', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin/bundle-enrollments');

  const approveButton = page.getByRole('button', { name: /check_circle Approve/ });
  await expect(approveButton).toBeVisible();
  await approveButton.click();

  await expect(page.getByText('No pending bundle enrollments')).toBeVisible();
});

test('dashboard shows bundle enrollments for authenticated students', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'student-token');

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Your learning space' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your bundles' })).toBeVisible();
  await expect(page.getByText(/Office Power Suite/)).toBeVisible();
});

test('homepage displays bundle section when bundles exist', async ({ page }) => {
  await mockApi(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Course bundles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View all bundles →' })).toBeVisible();
});

test('admin sidebar contains bundle navigation links', async ({ page }) => {
  await mockApi(page);
  await setAuthToken(page, 'admin-token');

  await page.goto('/admin');

  await expect(page.getByRole('link', { name: 'Bundles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bundle Enrollments' })).toBeVisible();
});
