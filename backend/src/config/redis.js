const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  // Skip Redis if no URL configured
  if (!process.env.REDIS_URL) {
    logger.info('Redis URL not configured, running without Redis');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Redis connected successfully'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, running without Redis:', error.message);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
