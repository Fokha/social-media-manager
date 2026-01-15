import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer configured to reuse existing server when running locally
  // Start the server manually with `npm run dev` before running tests
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 120000,
  } : undefined,
});
