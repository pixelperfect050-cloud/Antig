import { expect } from '@playwright/test';
import { TEST_ADMIN, TEST_MEMBER, DEMO_ADMIN, DEMO_MEMBER, ROUTES } from '../fixtures/test-data.js';

/**
 * Login as a specific user role using demo credentials
 */
export async function loginAs(page, role = 'admin') {
  const user = role === 'admin' ? DEMO_ADMIN : DEMO_MEMBER;
  await page.goto(ROUTES.login);
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder(/enter your email/i).fill(user.email);
  await page.getByPlaceholder(/enter your password/i).fill(user.password);
  await page.locator('#login-btn').click();

  // Wait for navigation to dashboard or pending approval
  await page.waitForURL(/\/(dashboard|pending-approval|setup)/, { timeout: 15000 });
}

/**
 * Login with specific credentials
 */
export async function loginWithCredentials(page, email, password) {
  await page.goto(ROUTES.login);
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(password);
  await page.locator('#login-btn').click();
}

/**
 * Logout the current user
 */
export async function logout(page) {
  // Try sidebar logout button first
  const logoutBtn = page.locator('#logout-btn');
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
  } else {
    // Navigate to settings and look for logout
    await page.goto(ROUTES.settings);
    const settingsLogout = page.locator('#logout-btn');
    if (await settingsLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsLogout.click();
    }
  }
  await page.waitForURL(/\/($|login)/, { timeout: 10000 });
}

/**
 * Check if user is authenticated by checking for dashboard access
 */
export async function isAuthenticated(page) {
  await page.goto(ROUTES.dashboard);
  const url = page.url();
  return !url.includes('/login');
}

/**
 * Set auth token directly in localStorage (faster than UI login)
 */
export async function setAuthToken(page, token) {
  await page.evaluate((t) => localStorage.setItem('token', t), token);
}

/**
 * Clear auth token
 */
export async function clearAuth(page) {
  await page.evaluate(() => localStorage.removeItem('token'));
}

/**
 * Dismiss tour guide if present
 */
export async function dismissTourIfPresent(page) {
  await page.evaluate(() => localStorage.setItem('tour_seen', 'true'));
}

/**
 * Setup page without tour interference
 */
export async function setupPageWithoutTour(page) {
  await page.addInitScript(() => {
    localStorage.setItem('tour_seen', 'true');
  });
}
