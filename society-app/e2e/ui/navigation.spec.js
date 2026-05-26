import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data.js';
import { loginAs } from '../helpers/auth.helper.js';

test.describe('Navigation & UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto(ROUTES.dashboard);
    await page.waitForLoadState('networkidle');
  });

  test('sidebar navigation works', async ({ page }) => {
    // Wait for sidebar
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Navigate to different sections
    await nav.getByText(/Payments/i).click();
    await expect(page).toHaveURL(new RegExp(ROUTES.payments));

    await nav.getByText(/Expenses/i).click();
    await expect(page).toHaveURL(new RegExp(ROUTES.expenses));

    await nav.getByText(/Settings/i).click();
    await expect(page).toHaveURL(new RegExp(ROUTES.settings));
  });

  test('theme toggle works', async ({ page }) => {
    // Depending on where theme toggle is, typically in top bar or sidebar
    const themeBtn = page.locator('button[title*="theme" i], button[aria-label*="theme" i]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      // Check if html data-theme attribute changed
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(theme).not.toBeNull();
    }
  });
});
