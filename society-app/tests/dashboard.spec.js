import { test, expect } from '@playwright/test';
import { createIssueCollector, assertNoPageIssues, assertNoOverflow, dismissTourIfPresent, loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };

test.describe('SocietySync dashboard', () => {
  test('dashboard widgets, navigation, charts, and tables', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, admin.email, admin.password);
    await dismissTourIfPresent(page);

    await expect(page.locator('#nav-dashboard')).toBeVisible({ timeout: 30000 });
    await page.waitForSelector('text=Flat Status Overview', { timeout: 30000 });
    await expect(page.locator('text=Total Collection')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Total Expenses')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Current Balance')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Flat Status Overview')).toBeVisible({ timeout: 30000 });

    await page.locator('#nav-payments').click();
    await expect(page).toHaveURL(/payments/);
    await expect(page.locator('text=Manage maintenance bills & payments')).toBeVisible();

    await page.locator('#nav-notifications').click();
    await expect(page).toHaveURL(/notifications/);
    await expect(page.locator('text=Notifications')).toBeVisible();

    await page.locator('#nav-dashboard').click();
    await expect(page).toHaveURL(/dashboard/);
    await assertNoOverflow(page);
    await assertNoPageIssues(issues);
  });
});
