/**
 * Analytics Routes - Dashboard analytics and metrics
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Post, SocialAccount, Message, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const cacheService = require('../services/cacheService');

/**
 * @route GET /api/analytics/overview
 * @desc Get dashboard overview stats
 */
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = cacheService.constructor.keys.userStats(userId);

    const stats = await cacheService.getOrSet(cacheKey, async () => {
      const [accounts, posts, messages, scheduledPosts] = await Promise.all([
        SocialAccount.count({ where: { userId, isActive: true } }),
        Post.count({ where: { userId } }),
        Message.count({ where: { userId, read: false } }),
        Post.count({ where: { userId, status: 'scheduled' } })
      ]);

      // Get posts by status
      const postsByStatus = await Post.findAll({
        where: { userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Get recent activity (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentPosts = await Post.count({
        where: { userId, createdAt: { [Op.gte]: weekAgo } }
      });

      return {
        accounts,
        posts,
        unreadMessages: messages,
        scheduledPosts,
        postsByStatus: postsByStatus.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
        recentActivity: { posts: recentPosts }
      };
    }, cacheService.constructor.TTL.MEDIUM);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/posts
 * @desc Get post analytics over time
 */
router.get('/posts', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '7d' } = req.query;

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Posts over time
    const postsOverTime = await Post.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Posts by platform
    const postsByPlatform = await Post.findAll({
      where: { userId },
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['platform']
      }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Post.id')), 'count']
      ],
      group: ['socialAccount.platform'],
      raw: true
    });

    // Top performing posts (if we had engagement data)
    const topPosts = await Post.findAll({
      where: { userId, status: 'published' },
      order: [['publishedAt', 'DESC']],
      limit: 5,
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['platform', 'platformUsername']
      }]
    });

    res.json({
      success: true,
      data: {
        timeline: postsOverTime,
        byPlatform: postsByPlatform,
        topPosts: topPosts.map(p => p.toJSON())
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/accounts
 * @desc Get account analytics
 */
router.get('/accounts', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const accounts = await SocialAccount.findAll({
      where: { userId },
      attributes: ['id', 'platform', 'platformUsername', 'profilePicture', 'isActive', 'createdAt']
    });

    // Get post count per account
    const postCounts = await Post.findAll({
      where: { userId },
      attributes: [
        'socialAccountId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'published' THEN 1 ELSE 0 END")), 'publishedCount']
      ],
      group: ['socialAccountId'],
      raw: true
    });

    const postCountMap = postCounts.reduce((acc, row) => {
      acc[row.socialAccountId] = {
        total: parseInt(row.postCount),
        published: parseInt(row.publishedCount) || 0
      };
      return acc;
    }, {});

    const accountsWithStats = accounts.map(account => ({
      ...account.toJSON(),
      stats: postCountMap[account.id] || { total: 0, published: 0 }
    }));

    res.json({ success: true, data: { accounts: accountsWithStats } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/engagement
 * @desc Get engagement metrics (placeholder for future platform API integration)
 */
router.get('/engagement', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '7d' } = req.query;

    // This would integrate with platform APIs to get real engagement data
    // For now, return placeholder structure
    res.json({
      success: true,
      data: {
        period,
        metrics: {
          impressions: 0,
          engagements: 0,
          clicks: 0,
          shares: 0,
          comments: 0,
          likes: 0
        },
        trend: {
          impressions: [],
          engagements: []
        },
        note: 'Connect platform APIs for real engagement data'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/best-times
 * @desc Get best times to post based on engagement (placeholder)
 */
router.get('/best-times', authenticate, async (req, res, next) => {
  try {
    // Would analyze historical engagement data
    // For now, return general best practices
    res.json({
      success: true,
      data: {
        twitter: { bestHours: [9, 12, 17], bestDays: ['Tuesday', 'Wednesday', 'Thursday'] },
        instagram: { bestHours: [11, 13, 19], bestDays: ['Tuesday', 'Wednesday', 'Friday'] },
        linkedin: { bestHours: [7, 12, 17], bestDays: ['Tuesday', 'Wednesday', 'Thursday'] },
        facebook: { bestHours: [9, 13, 16], bestDays: ['Wednesday', 'Thursday', 'Friday'] },
        note: 'Based on general best practices. Connect platform APIs for personalized recommendations.'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
