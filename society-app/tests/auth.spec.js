import { test, expect } from '@playwright/test';
import { createIssueCollector, assertNoPageIssues, dismissTourIfPresent, loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };
const member = { email: 'member1@society.com', password: 'member123' };

test.describe('SocietySync authentication', () => {
  test('admin login, navigation, and logout', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, admin.email, admin.password);

    await expect(page.locator('#nav-dashboard')).toBeVisible();
    await page.waitForSelector('text=Flat Status Overview', { timeout: 20000 });
    await expect(page.locator('text=Total Collection')).toBeVisible();

    await page.locator('#nav-notifications').click();
    await expect(page).toHaveURL(/notifications/);
    await expect(page.locator('text=Notifications')).toBeVisible();

    await page.locator('#nav-dashboard').click();
    await expect(page).toHaveURL(/dashboard/);
    await page.waitForSelector('text=Flat Status Overview', { timeout: 30000 });
    await expect(page.locator('text=Total Collection')).toBeVisible({ timeout: 30000 });

    await page.locator('#logout-btn').click();
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

    await assertNoPageIssues(issues);
  });

  test('member login and dashboard access', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, member.email, member.password);

    await expect(page.locator('#nav-dashboard')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h1:has-text("My Dashboard")')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#nav-notifications')).toBeVisible({ timeout: 30000 });

    await assertNoPageIssues(issues);
  });
});
