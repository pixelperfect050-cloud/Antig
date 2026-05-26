import { test, expect } from '@playwright/test';
import { ROUTES } from '../fixtures/test-data.js';
import { setupPageWithoutTour, loginAs } from '../helpers/auth.helper.js';

test.describe('Forgot Password Page @auth', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithoutTour(page);
    await page.goto(ROUTES.forgotPassword);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Email Step - Page Elements', () => {
    test('should display the forgot password page with branding', async ({ page }) => {
      await expect(page.locator('.auth-title')).toHaveText('SocietySync');
      await expect(page.locator('.auth-subtitle')).toHaveText('Reset your password');
    });

    test('should display lock icon', async ({ page }) => {
      await expect(page.locator('.auth-logo')).toHaveText('🔐');
    });

    test('should display forgot password heading', async ({ page }) => {
      await expect(page.getByText('Forgot Password?')).toBeVisible();
      await expect(page.getByText('Enter your email to receive a reset code')).toBeVisible();
    });

    test('should display email input field', async ({ page }) => {
      await expect(page.locator('#reset-email')).toBeVisible();
      await expect(page.locator('#reset-email')).toHaveAttribute('placeholder', 'Enter your registered email');
    });

    test('should display submit button', async ({ page }) => {
      const submitBtn = page.getByRole('button', { name: /send reset code/i });
      await expect(submitBtn).toBeVisible();
    });

    test('should display sign in link', async ({ page }) => {
      await expect(page.getByText('Remember your password?')).toBeVisible();
      await expect(page.getByText('Sign In')).toBeVisible();
    });

    test('should display theme toggle', async ({ page }) => {
      await expect(page.locator('.auth-theme-toggle')).toBeVisible();
    });
  });

  test.describe('Email Step - Interactions', () => {
    test('should fill in the email field', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await expect(page.locator('#reset-email')).toHaveValue('test@example.com');
    });

    test('should show browser validation for empty email', async ({ page }) => {
      await page.getByRole('button', { name: /send reset code/i }).click();
      const emailInput = page.locator('#reset-email');
      const isValid = await emailInput.evaluate(el => el.checkValidity());
      expect(isValid).toBe(false);
    });

    test('should navigate to sign in page', async ({ page }) => {
      await page.getByText('Sign In').click();
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });

    test('should toggle theme', async ({ page }) => {
      const themeToggle = page.locator('.auth-theme-toggle');
      await themeToggle.click();
      await expect(themeToggle).toBeVisible();
    });
  });

  test.describe('OTP Step Flow', () => {
    test('should transition to OTP step after submitting email', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      // Wait for OTP step (simulated with 1.5s delay)
      await expect(page.getByText('Enter Reset Code')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('We sent a code to test@example.com')).toBeVisible();
    });

    test('should display OTP input and new password fields', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.locator('#otp-code')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#new-password')).toBeVisible();
    });

    test('should display reset password button on OTP step', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible({ timeout: 5000 });
    });

    test('should display back to email button', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.getByText('← Back to email')).toBeVisible({ timeout: 5000 });
    });

    test('should go back to email step', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await page.getByText('← Back to email').click({ timeout: 5000 });
      await expect(page.getByText('Forgot Password?')).toBeVisible();
    });

    test('should toggle password visibility on OTP step', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.locator('#new-password')).toBeVisible({ timeout: 5000 });
      const passwordInput = page.locator('#new-password');
      const toggleBtn = page.locator('.password-toggle');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('Success Step Flow', () => {
    test('should show success message after password reset', async ({ page }) => {
      // Step 1: Enter email
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      // Step 2: Enter OTP and new password
      await expect(page.locator('#otp-code')).toBeVisible({ timeout: 5000 });
      await page.locator('#otp-code').fill('123456');
      await page.locator('#new-password').fill('NewPassword123');
      await page.getByRole('button', { name: /reset password/i }).click();

      // Step 3: Success
      await expect(page.getByText('Password Reset!')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('successfully reset')).toBeVisible();
    });

    test('should display Sign In Now link after success', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.locator('#otp-code')).toBeVisible({ timeout: 5000 });
      await page.locator('#otp-code').fill('123456');
      await page.locator('#new-password').fill('NewPassword123');
      await page.getByRole('button', { name: /reset password/i }).click();

      const signInLink = page.getByText('Sign In Now');
      await expect(signInLink).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to login from success step', async ({ page }) => {
      await page.locator('#reset-email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset code/i }).click();

      await expect(page.locator('#otp-code')).toBeVisible({ timeout: 5000 });
      await page.locator('#otp-code').fill('123456');
      await page.locator('#new-password').fill('NewPassword123');
      await page.getByRole('button', { name: /reset password/i }).click();

      await page.getByText('Sign In Now').click({ timeout: 5000 });
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Redirect Authenticated Users', () => {
    test('should redirect logged-in user away from forgot password', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto(ROUTES.forgotPassword);
      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 10000 });
      expect(page.url()).not.toContain('/forgot-password');
    });
  });
});
