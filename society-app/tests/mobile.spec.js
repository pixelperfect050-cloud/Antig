import { test, expect, devices } from '@playwright/test';
import { createIssueCollector, assertNoPageIssues, assertNoOverflow, loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };

test.describe('SocietySync mobile responsiveness', () => {
  test('works on Android viewport and mobile navigation', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['Pixel 5'] });
    const page = await context.newPage();
    const issues = createIssueCollector(page);

    await loginWithCredentials(page, admin.email, admin.password);
    await expect(page.locator('button#menu-toggle')).toBeVisible();
    await page.locator('button#menu-toggle').click();
    await page.locator('#nav-dashboard').click();
    await expect(page.locator('h1.page-title')).toBeVisible();
    await assertNoOverflow(page);
    await assertNoPageIssues(issues);

    await context.close();
  });

  test('works on tablet viewport and dashboard layout', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPad (gen 9) landscape'] });
    const page = await context.newPage();
    const issues = createIssueCollector(page);

    await loginWithCredentials(page, admin.email, admin.password);
    await expect(page.locator('#nav-expenses')).toBeVisible();
    await page.locator('#nav-expenses').click();
    await expect(page.locator('h1.page-title')).toHaveText('Expenses');
    await assertNoOverflow(page);
    await assertNoPageIssues(issues);

    await context.close();
  });
});
