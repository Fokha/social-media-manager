const request = require('supertest');

describe('Posts API', () => {
  let app;
  let authToken;
  let testUser;
  let testAccount;

  beforeAll(async () => {
    // Import models (this registers them with sequelize)
    const { sequelize, SocialAccount } = require('../../src/models');

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
        firstName: 'Posts',
        lastName: 'Tester'
      });

    authToken = registerRes.body.data.token;
    testUser = registerRes.body.data.user;

    // Create a test social account directly in database
    testAccount = await SocialAccount.create({
      userId: testUser.id,
      platform: 'twitter',
      platformUserId: `test-twitter-${Date.now()}`,
      platformUsername: 'testuser',
      platformDisplayName: 'Test User',
      accessToken: 'encrypted-test-token',
      isActive: true
    });
  });

  describe('GET /api/posts', () => {
    it('should return empty posts list initially', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toBeDefined();
      expect(Array.isArray(res.body.data.posts)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/posts');

      expect(res.status).toBe(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/posts?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/posts?status=published')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post content',
          socialAccountId: testAccount.id,
          contentType: 'text',
          status: 'draft'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post).toBeDefined();
      expect(res.body.data.post.content).toBe('Test post content');
    });

    it('should create scheduled post', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Scheduled post content',
          socialAccountId: testAccount.id,
          contentType: 'text',
          scheduledAt: futureDate
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.status).toBe('scheduled');
    });

    it('should reject post without content', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          socialAccountId: testAccount.id
        });

      expect(res.status).toBe(400);
    });

    it('should require authentication to create post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          content: 'Test content',
          socialAccountId: testAccount.id
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postToUpdate;

    beforeAll(async () => {
      // Create a post to update
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Original content',
          socialAccountId: testAccount.id,
          contentType: 'text',
          status: 'draft'
        });
      postToUpdate = res.body.data.post;
    });

    it('should update a post', async () => {
      const res = await request(app)
        .put(`/api/posts/${postToUpdate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.content).toBe('Updated content');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/posts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postToDelete;

    beforeAll(async () => {
      // Create a post to delete
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Post to delete',
          socialAccountId: testAccount.id,
          contentType: 'text',
          status: 'draft'
        });
      postToDelete = res.body.data.post;
    });

    it('should delete a post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
