const request = require('supertest');

describe('Auth API', () => {
  let app;

  beforeAll(async () => {
    // Import models (this registers them with sequelize)
    const { sequelize } = require('../../src/models');

    // Sync all models
    await sequelize.sync({ force: true });

    // Import app
    const server = require('../../src/index');
    app = server.app;
  });

  describe('Health Check', () => {
    it('GET /health should return status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: global.testUtils.generateTestEmail(),
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: global.testUtils.generateTestEmail(),
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with existing email', async () => {
      const email = global.testUtils.generateTestEmail();

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'SecurePass123!',
          firstName: 'First',
          lastName: 'User'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'AnotherPass123!',
          firstName: 'Another',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginEmail = `login-${Date.now()}@example.com`;
    const loginPassword = 'SecurePass123!';

    beforeAll(async () => {
      // Create a user to test login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: loginEmail,
          password: loginPassword,
          firstName: 'Login',
          lastName: 'Tester'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginEmail,
          password: loginPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginEmail,
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Create and login a user
      const email = global.testUtils.generateTestEmail();
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'SecurePass123!',
          firstName: 'Me',
          lastName: 'Tester'
        });
      authToken = registerRes.body.data.token;
    });

    it('should return user data with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});
