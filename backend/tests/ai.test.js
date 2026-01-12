const request = require('supertest');
const express = require('express');

// Mock the dependencies
jest.mock('../src/models', () => ({
  Subscription: {
    update: jest.fn()
  }
}));

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    isDemo: true,
    subscription: {
      plan: 'pro',
      usage: { aiCreditsUsed: 0 },
      limits: { aiCredits: 50 },
      canUseAI: () => true
    }
  };
  next();
};

// Import and use the router with mocked auth
jest.mock('../src/middleware/auth', () => ({
  authenticate: mockAuth,
  checkSubscription: () => (req, res, next) => next()
}));

const aiRoutes = require('../src/routes/ai');
app.use('/api/ai', aiRoutes);

describe('AI Routes', () => {
  describe('POST /api/ai/generate-content', () => {
    it('should generate demo content for Twitter', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          platform: 'twitter',
          topic: 'coffee'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.content.toLowerCase()).toContain('coffee');
      expect(response.body.data.creditsUsed).toBe(1);
    });

    it('should generate demo content for LinkedIn', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          platform: 'linkedin',
          topic: 'productivity'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.content.toLowerCase()).toContain('productivity');
    });

    it('should generate demo content for Instagram', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          platform: 'instagram',
          topic: 'fitness'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toContain('#');
    });

    it('should use prompt as topic if topic not provided', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          prompt: 'Generate a post about technology'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content.toLowerCase()).toContain('technology');
    });

    it('should default to twitter platform if not specified', async () => {
      const response = await request(app)
        .post('/api/ai/generate-content')
        .send({
          topic: 'marketing'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/ai/improve-content', () => {
    it('should improve existing content', async () => {
      const response = await request(app)
        .post('/api/ai/improve-content')
        .send({
          content: 'Check out our new product',
          platform: 'twitter',
          improvementType: 'engaging'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBeDefined();
    });
  });

  describe('POST /api/ai/generate-reply', () => {
    it('should generate a friendly reply', async () => {
      const response = await request(app)
        .post('/api/ai/generate-reply')
        .send({
          message: 'Great product!',
          tone: 'friendly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reply).toBeDefined();
    });

    it('should generate a professional reply', async () => {
      const response = await request(app)
        .post('/api/ai/generate-reply')
        .send({
          message: 'Can you tell me more about your services?',
          tone: 'professional'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reply).toBeDefined();
    });
  });
});

describe('Demo Response Generation', () => {
  it('should include hashtags in response', async () => {
    const response = await request(app)
      .post('/api/ai/generate-content')
      .send({
        platform: 'twitter',
        topic: 'artificial intelligence'
      });

    expect(response.body.data.content).toMatch(/#\w+/);
  });

  it('should handle multi-word topics', async () => {
    const response = await request(app)
      .post('/api/ai/generate-content')
      .send({
        platform: 'instagram',
        topic: 'digital marketing strategies'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.content.toLowerCase()).toContain('digital marketing');
  });

  it('should extract topic from generate prompts', async () => {
    const response = await request(app)
      .post('/api/ai/generate-content')
      .send({
        prompt: 'Generate a social media post about sustainable living'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.content.toLowerCase()).toContain('sustainable');
  });
});
