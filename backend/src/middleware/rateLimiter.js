const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Basic rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // More attempts in dev
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  }
});

// API rate limiter for external API calls
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'API rate limit exceeded'
  }
});

module.exports = { rateLimiter, authLimiter, apiLimiter };
