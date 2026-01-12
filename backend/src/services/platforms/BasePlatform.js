const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Base Platform Service
 * Provides common functionality for all platform integrations
 */
class BasePlatform {
  constructor(account) {
    this.account = account;
    this.accessToken = account.accessToken;
    this.platformUserId = account.platformUserId;
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...headers
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`${this.account.platform} API Error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  async refreshToken() {
    throw new Error('refreshToken must be implemented by subclass');
  }

  async publishPost(post) {
    throw new Error('publishPost must be implemented by subclass');
  }

  async sendMessage(options) {
    throw new Error('sendMessage must be implemented by subclass');
  }

  async getAnalytics() {
    throw new Error('getAnalytics must be implemented by subclass');
  }
}

module.exports = BasePlatform;
