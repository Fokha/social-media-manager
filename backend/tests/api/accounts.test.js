const request = require('supertest');

describe('Accounts API', () => {
  let app;
  let authToken;
  let testUser;
  let testAccount;

  beforeAll(async () => {
    // Import models (this registers them with sequelize)
    const { sequelize, SocialAccount: SA } = require('../../src/models');

    // Sync all models
    await sequelize.sync({ force: true });

    // Import app
    const server = require('../../src/index');
    app = server.app;

    // Create a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: global.testUtils.generateTestEmail(),
        password: 'SecurePass123!',
        firstName: 'Accounts',
        lastName: 'Tester'
      });

    authToken = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Create a test social account directly in database
    testAccount = await SA.create({
      userId: testUser.id,
      platform: 'twitter',
      platformUserId: `test-twitter-acct-${Date.now()}`,
      platformUsername: 'testaccount',
      platformDisplayName: 'Test Account',
      accessToken: 'encrypted-test-token',
      isActive: true
    });
  });

  describe('GET /api/accounts', () => {
    it('should return connected accounts list', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accounts).toBeDefined();
      expect(Array.isArray(res.body.data.accounts)).toBe(true);
      expect(res.body.data.accounts.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/accounts');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return a specific account', async () => {
      const res = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.platform).toBe('twitter');
    });

    it('should return 404 for non-existent account', async () => {
      const res = await request(app)
        .get('/api/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update account settings', async () => {
      const res = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let accountToDelete;

    beforeAll(async () => {
      // Create an account to delete
      const { SocialAccount: SA2 } = require('../../src/models');
      accountToDelete = await SA2.create({
        userId: testUser.id,
        platform: 'instagram',
        platformUserId: `test-instagram-del-${Date.now()}`,
        platformUsername: 'deleteme',
        platformDisplayName: 'Delete Me',
        accessToken: 'encrypted-test-token',
        isActive: true
      });
    });

    it('should disconnect an account', async () => {
      const res = await request(app)
        .delete(`/api/accounts/${accountToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should succeed on re-delete (soft delete)', async () => {
      // Soft delete - account still exists, just inactive
      const res = await request(app)
        .delete(`/api/accounts/${accountToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Soft delete returns 200 even on second delete
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/accounts/:id/refresh', () => {
    it('should attempt to refresh account token', async () => {
      const res = await request(app)
        .post(`/api/accounts/${testAccount.id}/refresh`)
        .set('Authorization', `Bearer ${authToken}`);

      // Token refresh may fail without real OAuth credentials
      // but should not return 401 (auth error)
      expect(res.status).not.toBe(401);
    });
  });
});

describe('OAuth API', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    // Import models (this registers them with sequelize)
    const { sequelize } = require('../../src/models');

    // Sync all models
    await sequelize.sync({ force: true });

    // Import app
    const server = require('../../src/index');
    app = server.app;

    // Create a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: global.testUtils.generateTestEmail(),
        password: 'SecurePass123!',
        firstName: 'OAuth',
        lastName: 'Tester'
      });

    authToken = registerRes.body.data.token;
  });

  describe('GET /api/oauth/:platform/url', () => {
    it('should return 503 when OAuth not configured for twitter', async () => {
      // Clear any OAuth env vars to ensure we test unconfigured state
      delete process.env.TWITTER_CLIENT_ID;

      const res = await request(app)
        .get('/api/oauth/twitter/url')
        .set('Authorization', `Bearer ${authToken}`);

      // Without OAuth credentials configured, should return 503
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('OAuth not configured');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/oauth/twitter/url');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/oauth/:platform/connect', () => {
    it('should return 503 when OAuth not configured', async () => {
      delete process.env.INSTAGRAM_CLIENT_ID;
      delete process.env.FACEBOOK_APP_ID;

      const res = await request(app)
        .get('/api/oauth/instagram/connect')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(503);
    });
  });
});
