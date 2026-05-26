import { test, expect } from '@playwright/test';
import { createIssueCollector, assertNoBrokenButtons, assertNoOverflow, assertNoPageIssues, dismissTourIfPresent, loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };
const keyPages = ['/dashboard', '/payments', '/expenses', '/notifications'];

test.describe('SocietySync stability checks', () => {
  test('core pages should load without console errors, API failures, or broken buttons', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, admin.email, admin.password);
    await dismissTourIfPresent(page);

    for (const route of keyPages) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 60000 });
      await expect(page.locator('body')).toBeVisible();
      await assertNoBrokenButtons(page);
      await assertNoPageIssues(issues);
    }
  });

  test('key pages should not overflow on mobile screen sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginWithCredentials(page, admin.email, admin.password);
    await dismissTourIfPresent(page);

    for (const route of keyPages) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 60000 });
      await assertNoOverflow(page);
    }
  });
});
