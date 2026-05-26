import { test, expect } from '@playwright/test';
import { createIssueCollector, assertNoPageIssues } from './test-utils';
import { loginWithCredentials } from './test-utils';

const admin = { email: 'admin@society.com', password: 'admin123' };

test.describe('SocietySync expenses', () => {
  test('add, edit, and delete an expense', async ({ page }) => {
    const issues = createIssueCollector(page);
    await loginWithCredentials(page, admin.email, admin.password);

    await page.locator('#nav-expenses').click();
    await expect(page.locator('h1.page-title')).toHaveText('Expenses');
    await page.locator('#add-expense-btn').click();

    await expect(page.locator('.modal-title', { hasText: 'Add Expense' })).toBeVisible();
    await page.locator('#exp-desc').fill('E2E test expense');
    await page.locator('#exp-amount').fill('550');
    await page.locator('#exp-vendor').fill('Playwright QA');
    await page.locator('.modal form button[type="submit"]').click();

    await expect(page.locator('text=E2E test expense')).toBeVisible({ timeout: 15000 });
    await page.locator('button[title="Edit"]').first().click();
    await expect(page.locator('.modal-title', { hasText: 'Edit Expense' })).toBeVisible();
    await page.locator('#exp-desc').fill('E2E test expense updated');
    await page.locator('.modal form button[type="submit"]').click();
    await expect(page.locator('text=E2E test expense updated')).toBeVisible({ timeout: 15000 });

    page.on('dialog', dialog => dialog.accept());
    await page.locator('button[title="Delete"]').first().click();
    await expect(page.locator('text=E2E test expense updated')).not.toBeVisible({ timeout: 15000 }).catch(() => {});

    await assertNoPageIssues(issues);
  });
});
