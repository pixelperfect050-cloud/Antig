import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data.js';
import { loginAs } from '../helpers/auth.helper.js';

test.describe('Expenses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(ROUTES.expenses);
    await page.waitForLoadState('networkidle');
  });

  test('should display expenses list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Expenses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Expense/i })).toBeVisible();
  });

  test('add expense modal works', async ({ page }) => {
    await page.getByRole('button', { name: /Add Expense/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /Save Expense|Add/i }).click();
    // Assuming required HTML5 validation or UI error
    
    await page.getByRole('button', { name: /Cancel|Close/i }).click();
  });
});
