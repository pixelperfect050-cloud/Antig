import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ADMIN } from '../fixtures/test-data.js';
import { setupPageWithoutTour, loginAs } from '../helpers/auth.helper.js';

test.describe('Register Page @auth', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithoutTour(page);
    await page.goto(ROUTES.register);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Elements', () => {
    test('should display the registration page with branding', async ({ page }) => {
      await expect(page.locator('.auth-title')).toHaveText('SocietySync');
      await expect(page.locator('.auth-logo')).toBeVisible();
    });

    test('should display Create Account heading', async ({ page }) => {
      await expect(page.getByText('Create Account')).toBeVisible();
      await expect(page.getByText('Get started with SocietySync')).toBeVisible();
    });

    test('should display all registration form fields', async ({ page }) => {
      await expect(page.locator('#reg-name')).toBeVisible();
      await expect(page.locator('#reg-email')).toBeVisible();
      await expect(page.locator('#reg-phone')).toBeVisible();
      await expect(page.locator('#reg-password')).toBeVisible();
      await expect(page.locator('#reg-confirm')).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
      await expect(page.locator('#register-btn')).toBeVisible();
      await expect(page.locator('#register-btn')).toHaveText('Create Account');
    });

    test('should display sign in link', async ({ page }) => {
      await expect(page.getByText('Already have an account?')).toBeVisible();
      await expect(page.getByText('Sign In')).toBeVisible();
    });

    test('should display theme toggle button', async ({ page }) => {
      await expect(page.locator('.auth-theme-toggle')).toBeVisible();
    });
  });

  test.describe('Form Input Interactions', () => {
    test('should fill in the name field', async ({ page }) => {
      const nameInput = page.locator('#reg-name');
      await nameInput.fill('John Doe');
      await expect(nameInput).toHaveValue('John Doe');
    });

    test('should fill in the email field', async ({ page }) => {
      const emailInput = page.locator('#reg-email');
      await emailInput.fill('john@test.com');
      await expect(emailInput).toHaveValue('john@test.com');
    });

    test('should fill in the phone field', async ({ page }) => {
      const phoneInput = page.locator('#reg-phone');
      await phoneInput.fill('9876543210');
      await expect(phoneInput).toHaveValue('9876543210');
    });
  });

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility for password field', async ({ page }) => {
      const passwordInput = page.locator('#reg-password');
      const toggleButtons = page.locator('.password-toggle');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await toggleButtons.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleButtons.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should toggle password visibility for confirm password field', async ({ page }) => {
      const confirmInput = page.locator('#reg-confirm');
      const toggleButtons = page.locator('.password-toggle');

      await expect(confirmInput).toHaveAttribute('type', 'password');
      await toggleButtons.nth(1).click();
      await expect(confirmInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('Password Strength Indicator', () => {
    test('should show weak password indicator', async ({ page }) => {
      await page.locator('#reg-password').fill('abc');
      await expect(page.locator('.password-strength__text')).toHaveText('Weak');
    });

    test('should show strong password indicator', async ({ page }) => {
      await page.locator('#reg-password').fill('MyStr0ng!');
      const strengthText = page.locator('.password-strength__text');
      await expect(strengthText).toBeVisible();
      const text = await strengthText.textContent();
      expect(['Strong', 'Excellent']).toContain(text);
    });

    test('should not show strength indicator with empty password', async ({ page }) => {
      await expect(page.locator('.password-strength')).not.toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should show browser validation for empty required fields', async ({ page }) => {
      await page.locator('#register-btn').click();
      const nameInput = page.locator('#reg-name');
      const isValid = await nameInput.evaluate(el => el.checkValidity());
      expect(isValid).toBe(false);
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.locator('#reg-name').fill('Test User');
      await page.locator('#reg-email').fill('test@example.com');
      await page.locator('#reg-phone').fill('9876543210');
      await page.locator('#reg-password').fill('Password123');
      await page.locator('#reg-confirm').fill('DifferentPassword');
      await page.locator('#register-btn').click();

      await expect(page.locator('.alert--error')).toHaveText('Passwords do not match');
    });

    test('should show error for short password', async ({ page }) => {
      await page.locator('#reg-name').fill('Test User');
      await page.locator('#reg-email').fill('test@example.com');
      await page.locator('#reg-phone').fill('9876543210');
      await page.locator('#reg-password').fill('abc');
      await page.locator('#reg-confirm').fill('abc');
      await page.locator('#register-btn').click();

      await expect(page.locator('.alert--error')).toHaveText('Password must be at least 6 characters');
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate to login page', async ({ page }) => {
      await page.getByText('Sign In').click();
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle theme on register page', async ({ page }) => {
      const themeToggle = page.locator('.auth-theme-toggle');
      await themeToggle.click();
      await expect(themeToggle).toBeVisible();
    });
  });

  test.describe('Redirect Authenticated Users', () => {
    test('should redirect logged-in user away from register page', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto(ROUTES.register);
      await page.waitForURL(/\/(dashboard|setup)/, { timeout: 10000 });
      expect(page.url()).not.toContain('/register');
    });
  });
});
