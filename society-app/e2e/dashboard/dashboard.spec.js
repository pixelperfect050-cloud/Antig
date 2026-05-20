import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data.js';
import { loginAs } from '../helpers/auth.helper.js';

test.describe('Dashboard - Admin View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState('networkidle');
  });

  test('should display all main dashboard sections', async ({ page }) => {
    // Check main headings
    await expect(page.getByRole('heading', { name: /Dashboard/i, exact: true })).toBeVisible();
    await expect(page.getByText(/Total Collection/i)).toBeVisible();
    await expect(page.getByText(/Pending Dues/i)).toBeVisible();
    
    // Check charts
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
  });

  test('quick action buttons navigate correctly', async ({ page }) => {
    // Collect maintenance
    await page.getByRole('button', { name: /Collect Maintenance/i }).click();
    await expect(page).toHaveURL(new RegExp(ROUTES.payments));
    await page.goto(ROUTES.dashboard);

    // Add Expense
    await page.getByRole('button', { name: /Add Expense/i }).click();
    await expect(page).toHaveURL(new RegExp(ROUTES.expenses));
  });
});

test.describe('Dashboard - Member View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'member');
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState('networkidle');
  });

  test('should display member specific dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
    await expect(page.getByText(/My Payments/i)).toBeVisible();
    await expect(page.getByText(/Society Announcements/i)).toBeVisible();
  });
});
