import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    // Check for hero heading on the landing page
    await expect(page.getByRole('heading', { name: /Manage All Your Social Media/i })).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check if there's a Sign In link in the header
    const loginLink = page.getByRole('link', { name: /Sign In/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });

  test('should show 404 for non-existent pages', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // Should either return 404 or show 404 page
    const title = await page.title();
    expect(title).toMatch(/404|not found/i);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    // Page should still work on mobile
    await expect(page.getByRole('heading', { name: /Manage All Your Social Media/i })).toBeVisible();
  });
});
