import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data.js';
import { loginAs } from '../helpers/auth.helper.js';

test.describe('Payments - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(ROUTES.payments);
    await page.waitForLoadState('networkidle');
  });

  test('should display payments list and allow filtering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Payments/i })).toBeVisible();
    
    // Check filters
    const statusFilter = page.locator('select').first();
    await statusFilter.selectOption('pending');
    await expect(page.url()).toContain('payments');
  });

  test('record payment modal opens', async ({ page }) => {
    await page.getByRole('button', { name: /Record Payment/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Record New Payment/i)).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /Cancel|Close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('Payments - Member', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'member');
    await page.goto(ROUTES.payments);
    await page.waitForLoadState('networkidle');
  });

  test('should display own payment history', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /My Payments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request Payment/i })).toBeVisible();
  });
});
