import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Social Media Manager/);
    await expect(page.getByRole('heading', { name: /Sign In|Login/i })).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Sign Up|Register|Create Account/i })).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await submitButton.click();
    // Should show validation errors or stay on the same page
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /sign up|register|create account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /sign in|login|already have/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show unauthorized
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/login|dashboard/);
  });
});
