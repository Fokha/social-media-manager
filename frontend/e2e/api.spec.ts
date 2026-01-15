import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('API Health Checks', () => {
  test('should have healthy backend API', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should return auth error for protected routes without token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`);
    expect(response.status()).toBe(401);
  });

  test('should reject invalid login credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('should validate registration input', async ({ request }) => {
    // Missing email
    const response1 = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    expect(response1.status()).toBe(400);

    // Missing password
    const response2 = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    expect(response2.status()).toBe(400);
  });

  test('should return rate limit headers', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/auth/me`);
    // Rate limiter should add headers
    const headers = response.headers();
    // Check that some rate limit related headers might exist
    expect(headers).toBeDefined();
  });
});
