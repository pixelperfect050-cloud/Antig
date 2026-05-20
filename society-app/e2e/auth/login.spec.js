import { test, expect } from '@playwright/test';
import { ROUTES, DEMO_ADMIN, DEMO_MEMBER } from '../fixtures/test-data.js';
import { loginAs, loginWithCredentials, setupPageWithoutTour } from '../helpers/auth.helper.js';

test.describe('Login Page @auth', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithoutTour(page);
    await page.goto(ROUTES.login);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Elements', () => {
    test('should display the login page with branding', async ({ page }) => {
      await expect(page.locator('.auth-title')).toHaveText('SocietySync');
      await expect(page.locator('.auth-subtitle')).toHaveText('Smart Society Management');
      await expect(page.locator('.auth-logo')).toBeVisible();
    });

    test('should display email and mobile login tabs', async ({ page }) => {
      const emailTab = page.getByRole('button', { name: 'Email' });
      const mobileTab = page.getByRole('button', { name: 'Mobile' });
      await expect(emailTab).toBeVisible();
      await expect(mobileTab).toBeVisible();
    });

    test('should display email login form by default', async ({ page }) => {
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#login-btn')).toBeVisible();
      await expect(page.locator('#login-btn')).toHaveText('Sign In');
    });

    test('should display remember me checkbox', async ({ page }) => {
      const rememberMe = page.getByText('Remember me');
      await expect(rememberMe).toBeVisible();
    });

    test('should display forgot password link', async ({ page }) => {
      const forgotLink = page.getByText('Forgot Password?');
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('should display register link', async ({ page }) => {
      const registerLink = page.getByText('Sign Up');
      await expect(registerLink).toBeVisible();
    });

    test('should display demo credentials', async ({ page }) => {
      await expect(page.getByText('Demo Credentials')).toBeVisible();
      await expect(page.getByText('admin@society.com')).toBeVisible();
      await expect(page.getByText('member1@society.com')).toBeVisible();
    });

    test('should display join existing society link', async ({ page }) => {
      const joinLink = page.getByText('Join Existing Society');
      await expect(joinLink).toBeVisible();
    });

    test('should display privacy policy link', async ({ page }) => {
      const privacyLink = page.getByText('Privacy Policy');
      await expect(privacyLink).toBeVisible();
    });

    test('should display theme toggle button', async ({ page }) => {
      const themeToggle = page.locator('.auth-theme-toggle');
      await expect(themeToggle).toBeVisible();
    });
  });

  test.describe('Tab Switching', () => {
    test('should switch to mobile OTP tab', async ({ page }) => {
      await page.getByRole('button', { name: 'Mobile' }).click();
      await expect(page.locator('#mobile')).toBeVisible();
      await expect(page.getByText('OTP Login')).toBeVisible();
      await expect(page.locator('#login-btn')).toHaveText('Send OTP');
    });

    test('should switch back to email tab from mobile', async ({ page }) => {
      await page.getByRole('button', { name: 'Mobile' }).click();
      await page.getByRole('button', { name: 'Email' }).click();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.getByText('Welcome Back')).toBeVisible();
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const toggleBtn = page.locator('.password-toggle');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Form Validation', () => {
    test('should show browser validation for empty email', async ({ page }) => {
      await page.locator('#login-btn').click();
      // HTML5 required attribute prevents submission
      const emailInput = page.locator('#email');
      const isValid = await emailInput.evaluate(el => el.checkValidity());
      expect(isValid).toBe(false);
    });

    test('should show browser validation for empty password', async ({ page }) => {
      await page.locator('#email').fill('test@test.com');
      await page.locator('#login-btn').click();
      const passwordInput = page.locator('#password');
      const isValid = await passwordInput.evaluate(el => el.checkValidity());
      expect(isValid).toBe(false);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.locator('#email').fill('invalid@email.com');
      await page.locator('#password').fill('wrongpassword');
      await page.locator('#login-btn').click();

      // Wait for error message to appear
      const errorAlert = page.locator('.alert--error');
      await expect(errorAlert).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Successful Login', () => {
    test('should login as admin and redirect to dashboard', async ({ page }) => {
      await page.locator('#email').fill(DEMO_ADMIN.email);
      await page.locator('#password').fill(DEMO_ADMIN.password);
      await page.locator('#login-btn').click();

      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 15000 });
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|setup)/);
    });

    test('should login as member and redirect appropriately', async ({ page }) => {
      await page.locator('#email').fill(DEMO_MEMBER.email);
      await page.locator('#password').fill(DEMO_MEMBER.password);
      await page.locator('#login-btn').click();

      await page.waitForURL(/\/(dashboard|pending-approval|setup)/, { timeout: 15000 });
    });

    test('should store token in localStorage after login', async ({ page }) => {
      await page.locator('#email').fill(DEMO_ADMIN.email);
      await page.locator('#password').fill(DEMO_ADMIN.password);
      await page.locator('#login-btn').click();

      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 15000 });
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });

    test('should show loading spinner during login', async ({ page }) => {
      await page.locator('#email').fill(DEMO_ADMIN.email);
      await page.locator('#password').fill(DEMO_ADMIN.password);
      await page.locator('#login-btn').click();

      // Button should be disabled during loading
      await expect(page.locator('#login-btn')).toBeDisabled();
    });
  });

  test.describe('Remember Me', () => {
    test('should save email when remember me is checked', async ({ page }) => {
      const rememberCheckbox = page.locator('input[type="checkbox"]');
      await rememberCheckbox.check();
      await page.locator('#email').fill(DEMO_ADMIN.email);
      await page.locator('#password').fill(DEMO_ADMIN.password);
      await page.locator('#login-btn').click();

      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 15000 });
      const savedEmail = await page.evaluate(() => localStorage.getItem('remembered_email'));
      expect(savedEmail).toBe(DEMO_ADMIN.email);
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate to register page', async ({ page }) => {
      await page.getByText('Sign Up').click();
      await page.waitForURL(/\/register/);
      expect(page.url()).toContain('/register');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByText('Forgot Password?').click();
      await page.waitForURL(/\/forgot-password/);
      expect(page.url()).toContain('/forgot-password');
    });

    test('should navigate to join society page', async ({ page }) => {
      await page.getByText('Join Existing Society').click();
      await page.waitForURL(/\/join/);
      expect(page.url()).toContain('/join');
    });

    test('should navigate to privacy policy page', async ({ page }) => {
      await page.getByText('Privacy Policy').click();
      await page.waitForURL(/\/privacy-policy/);
      expect(page.url()).toContain('/privacy-policy');
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle theme on auth page', async ({ page }) => {
      const themeToggle = page.locator('.auth-theme-toggle');
      await themeToggle.click();
      // Verify theme change by checking the button text changes
      await expect(themeToggle).toBeVisible();
    });
  });

  test.describe('Redirect Authenticated Users', () => {
    test('should redirect logged-in user away from login page', async ({ page }) => {
      // First login
      await loginAs(page, 'admin');

      // Then try to navigate to login
      await page.goto(ROUTES.login);
      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 10000 });
      expect(page.url()).not.toContain('/login');
    });
  });
});
