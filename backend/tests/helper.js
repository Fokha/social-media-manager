const request = require('supertest');
const { app } = require('../src/index');
const { sequelize } = require('../src/config/database');
const { User, Subscription } = require('../src/models');

/**
 * Test Helper Functions
 */
class TestHelper {
  constructor() {
    this.tokens = {};
    this.users = {};
  }

  /**
   * Initialize test database
   */
  async initDatabase() {
    await sequelize.sync({ force: true });
  }

  /**
   * Clean up database
   */
  async cleanup() {
    await User.destroy({ where: {}, force: true });
    await Subscription.destroy({ where: {}, force: true });
  }

  /**
   * Create a test user and get auth token
   */
  async createUserAndLogin(userData = {}) {
    const defaultData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const data = { ...defaultData, ...userData };
    
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(data);
    
    if (registerRes.status !== 201 && registerRes.status !== 200) {
      throw new Error(`Registration failed: ${JSON.stringify(registerRes.body)}`);
    }
    
    const userId = registerRes.body.data.user.id;
    const token = registerRes.body.data.token;
    
    this.tokens[userId] = token;
    this.users[userId] = registerRes.body.data.user;
    
    return { user: registerRes.body.data.user, token };
  }

  /**
   * Make authenticated request
   */
  authRequest(token) {
    return {
      get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
      post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
      put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
      delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
    };
  }
}

module.exports = new TestHelper();
