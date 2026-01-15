/**
 * Cache Service - Redis caching layer
 */
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.defaultTTL = 300; // 5 minutes
  }

  /**
   * Initialize Redis connection
   */
  async initialize(redisClient) {
    if (!redisClient) {
      logger.warn('Cache service disabled - no Redis client');
      return;
    }

    this.client = redisClient;
    this.enabled = true;
    logger.info('Cache service initialized');
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.enabled) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return false;

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!this.enabled) return false;

    try {
      await this.client.del(key);
      logger.debug(`Cache delete: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    if (!this.enabled) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Cache delete pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Try cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUser(userId) {
    await this.delPattern(`user:${userId}:*`);
  }

  /**
   * Invalidate post-related caches
   */
  async invalidatePost(postId) {
    await this.delPattern(`post:${postId}:*`);
    await this.delPattern(`posts:*`);
  }

  /**
   * Invalidate account-related caches
   */
  async invalidateAccount(accountId) {
    await this.delPattern(`account:${accountId}:*`);
    await this.delPattern(`accounts:*`);
  }

  // ============================================================================
  // Cache Key Generators
  // ============================================================================

  static keys = {
    user: (userId) => `user:${userId}`,
    userPosts: (userId, page = 1) => `user:${userId}:posts:${page}`,
    userAccounts: (userId) => `user:${userId}:accounts`,
    userStats: (userId) => `user:${userId}:stats`,
    userNotifications: (userId, page = 1) => `user:${userId}:notifications:${page}`,

    post: (postId) => `post:${postId}`,
    postAnalytics: (postId) => `post:${postId}:analytics`,

    account: (accountId) => `account:${accountId}`,
    accountAnalytics: (accountId, period) => `account:${accountId}:analytics:${period}`,

    platformRateLimit: (platform, accountId) => `ratelimit:${platform}:${accountId}`,

    analytics: (userId, period) => `analytics:${userId}:${period}`,
    trending: (platform) => `trending:${platform}`,
  };

  // ============================================================================
  // TTL Constants
  // ============================================================================

  static TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 3600,       // 1 hour
    DAY: 86400,       // 24 hours
    WEEK: 604800,     // 7 days
  };
}

module.exports = new CacheService();
