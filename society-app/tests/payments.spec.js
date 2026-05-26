import { test, expect } from '@playwright/test';
import { createIssueCollector, assertNoPageIssues, dismissTourIfPresent, loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };

test.describe('SocietySync payments', () => {
  test('maintenance page loads and payment actions are available', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, admin.email, admin.password);
    await dismissTourIfPresent(page);

    await page.locator('#nav-payments').click({ force: true });
    await dismissTourIfPresent(page);
    await expect(page).toHaveURL(/payments/, { timeout: 20000 });
    await expect(page.locator('button:has-text("📄 Generate Bills")')).toBeVisible();
    await expect(page.locator('button:has-text("➕ Manual Entry")')).toBeVisible();

    await page.locator('button:has-text("➕ Manual Entry")').click();
    await expect(page.locator('.modal-title', { hasText: 'Manual Payment Entry' })).toBeVisible();
    await expect(page.locator('.modal form label:has-text("Select Block") + select')).toBeVisible();
    await expect(page.locator('.modal form label:has-text("Select Flat") + select')).toBeVisible();
    await expect(page.locator('.modal button:has-text("Cancel")')).toBeVisible();

    await page.locator('.modal button:has-text("Cancel")').click();

    await page.locator('#nav-payment-verification').click();
    await dismissTourIfPresent(page);
    await expect(page).toHaveURL(/payment-verification/);
    await expect(page.locator('text=Payment Verification')).toBeVisible();
    const approveButtons = page.locator('button:has-text("Approve")');
    if (await approveButtons.count() > 0) {
      await expect(approveButtons.first()).toBeVisible();
    } else {
      await expect(page.locator('text=No')).toContainText('No');
    }

    await assertNoPageIssues(issues);
  });
});
