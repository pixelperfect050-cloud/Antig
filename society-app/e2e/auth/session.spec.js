import { test, expect } from '@playwright/test';
import { ROUTES, DEMO_ADMIN, ADMIN_ONLY_ROUTES } from '../fixtures/test-data.js';
import { loginAs, clearAuth, setupPageWithoutTour } from '../helpers/auth.helper.js';

test.describe('Session Management @auth', () => {
  test.describe('Token Persistence', () => {
    test('should persist token across page reload', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'admin');

      // Get token before reload
      const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenBefore).toBeTruthy();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Token should persist
      const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenAfter).toBeTruthy();
      expect(tokenAfter).toBe(tokenBefore);
    });

    test('should remain on dashboard after page refresh when authenticated', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'admin');

      await page.goto(ROUTES.dashboard);
      await page.waitForLoadState('networkidle');
      await page.reload();

      // Should not redirect to login
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).not.toContain('/login');
    });
  });

  test.describe('Expired/Invalid Token', () => {
    test('should redirect to login when token is cleared', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'admin');

      // Clear token
      await clearAuth(page);
      await page.goto(ROUTES.dashboard);

      // Should redirect to login
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect to login with invalid token', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.login);
      await page.waitForLoadState('networkidle');

      // Set an invalid token
      await page.evaluate(() => localStorage.setItem('token', 'invalid-jwt-token-123'));
      await page.goto(ROUTES.dashboard);

      // Should redirect to login (token validation fails)
      await page.waitForURL(/\/($|login)/, { timeout: 15000 });
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.dashboard);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from payments to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.payments);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from expenses to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.expenses);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from settings to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.settings);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from blocks to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.blocks);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from reports to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.reports);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from notifications to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.notifications);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });

    test('should redirect unauthenticated user from funds to login', async ({ page }) => {
      await setupPageWithoutTour(page);
      await page.goto(ROUTES.funds);
      await page.waitForURL(/\/($|login)/, { timeout: 10000 });
    });
  });

  test.describe('Admin-Only Routes', () => {
    test('should redirect non-admin from member requests to dashboard', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'member');

      await page.goto(ROUTES.requests);
      await page.waitForURL(/\/(dashboard|pending-approval)/, { timeout: 10000 });
    });

    test('should redirect non-admin from payment verification to dashboard', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'member');

      await page.goto(ROUTES.paymentVerification);
      await page.waitForURL(/\/(dashboard|pending-approval)/, { timeout: 10000 });
    });

    test('should redirect non-admin from admin management to dashboard', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'member');

      await page.goto(ROUTES.adminManagement);
      await page.waitForURL(/\/(dashboard|pending-approval)/, { timeout: 10000 });
    });

    test('should redirect non-admin from activity log to dashboard', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'member');

      await page.goto(ROUTES.activityLog);
      await page.waitForURL(/\/(dashboard|pending-approval)/, { timeout: 10000 });
    });

    test('should redirect non-admin from demo leads to dashboard', async ({ page }) => {
      await setupPageWithoutTour(page);
      await loginAs(page, 'member');

      await page.goto(ROUTES.demoLeads);
      await page.waitForURL(/\/(dashboard|pending-approval)/, { timeout: 10000 });
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to privacy policy without auth', async ({ page }) => {
      await page.goto(ROUTES.privacyPolicy);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/privacy-policy');
    });

    test('should allow access to join society without auth', async ({ page }) => {
      await page.goto(ROUTES.join);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/join');
    });

    test('should allow access to login without auth', async ({ page }) => {
      await page.goto(ROUTES.login);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/login');
    });

    test('should allow access to register without auth', async ({ page }) => {
      await page.goto(ROUTES.register);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/register');
    });
  });
});
