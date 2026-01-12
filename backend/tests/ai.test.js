const request = require('supertest');

describe('AI Routes', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    // Clear AI API keys to test unconfigured state
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    // Import models (this registers them with sequelize)
    const { sequelize } = require('../src/models');

    // Sync all models
    await sequelize.sync({ force: true });

    // Import app
    const server = require('../src/index');
    app = server.app;

    // Create a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: global.testUtils.generateTestEmail(),
        password: 'SecurePass123!',
        firstName: 'AI',
        lastName: 'Tester'
      });

    authToken = registerRes.body.data.token;
  });

  describe('POST /api/ai/generate-content', () => {
    it('should return 503 when AI service not configured', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'twitter',
          topic: 'coffee'
        });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('AI service not configured');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          platform: 'twitter',
          topic: 'coffee'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/ai/improve-content', () => {
    it('should return 503 when AI service not configured', async () => {
      const response = await request(app)
        .post('/api/ai/improve-content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Check out our new product',
          platform: 'twitter',
          improvementType: 'engaging'
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('AI service not configured');
    });
  });

  describe('POST /api/ai/generate-reply', () => {
    it('should return 503 when AI service not configured', async () => {
      const response = await request(app)
        .post('/api/ai/generate-reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Great product!',
          tone: 'friendly'
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('AI service not configured');
    });
  });

  describe('POST /api/ai/hashtag-suggestions', () => {
    it('should return 503 when AI service not configured', async () => {
      const response = await request(app)
        .post('/api/ai/hashtag-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Check out our new product launch',
          platform: 'twitter'
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('AI service not configured');
    });
  });

  describe('POST /api/ai/analyze-sentiment', () => {
    it('should return 503 when AI service not configured', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-sentiment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          texts: ['Great product!', 'This is terrible']
        });

      // May return 503 for AI not configured or 403 for subscription required
      expect([503, 403]).toContain(response.status);
    });
  });
});
