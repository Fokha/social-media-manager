/**
 * Jest Test Setup
 * Runs before each test file
 */
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32characters';

// Use the shared test database (created by globalSetup.js)
process.env.SQLITE_PATH = path.join(__dirname, '.test-db.sqlite');

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  generateTestEmail: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  generateTestPassword: () => 'TestPassword123!',
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Cleanup after all tests in this file
afterAll(async () => {
  // Allow async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
