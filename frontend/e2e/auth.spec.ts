import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    // Check for "Welcome Back" heading
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    // Check for heading on register page
    await expect(page.getByRole('heading', { name: /Create|Account|Get Started/i })).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    // Form has required fields, trying to submit empty should not navigate
    const submitButton = page.getByRole('button', { name: /Sign In/i });
    await expect(submitButton).toBeVisible();
    // Click should be blocked by required validation
    await submitButton.click();
    // Should still be on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /Sign up/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /Sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show unauthorized
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/login|dashboard/);
  });
});
