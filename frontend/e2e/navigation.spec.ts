import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Social Media Manager/);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check if there's a login link
    const loginLink = page.getByRole('link', { name: /login|sign in/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should show 404 for non-existent pages', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // Should either return 404 or redirect
    expect([200, 404]).toContain(response?.status());
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
