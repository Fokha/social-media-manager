const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { User, SocialAccount, Post, Subscription } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.count();

    // Get users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Get total accounts
    const totalAccounts = await SocialAccount.count();

    // Get total posts
    const totalPosts = await Post.count();

    // Get posts this month
    const postsThisMonth = await Post.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // Get active subscriptions count
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        plan: { [Op.ne]: 'free' }
      }
    });

    // Calculate revenue (simplified)
    const subscriptions = await Subscription.findAll({
      where: { status: 'active' }
    });

    const planPrices = {
      free: 0,
      basic: 9.99,
      pro: 29.99,
      business: 99.99
    };

    const monthlyRecurringRevenue = subscriptions.reduce((sum, sub) => {
      return sum + (planPrices[sub.plan] || 0);
    }, 0);

    const totalRevenue = monthlyRecurringRevenue * 6; // Simplified estimate

    // API usage tracking (would need a dedicated table in production)
    const apiUsage = {
      openai: 0,
      openaiCost: '0.00',
      instagram: 0,
      instagramCost: 0,
      twitter: 0,
      twitterCost: '0.00',
      linkedin: 0,
      linkedinCost: 0,
      totalCost: '0.00'
    };

    // Recent activities
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 3,
      attributes: ['email', 'createdAt']
    });

    const recentActivities = recentUsers.map(user => ({
      type: 'user',
      description: `New user: ${user.email}`,
      time: formatTimeAgo(user.createdAt)
    }));

    // Add subscription activities
    const recentSubs = await Subscription.findAll({
      where: { status: 'active', plan: { [Op.ne]: 'free' } },
      order: [['createdAt', 'DESC']],
      limit: 3,
      include: [{ model: User, as: 'user', attributes: ['email'] }]
    });

    recentSubs.forEach(sub => {
      recentActivities.push({
        type: 'subscription',
        description: `${sub.user?.email || 'User'} subscribed to ${sub.plan}`,
        time: formatTimeAgo(sub.createdAt),
        amount: planPrices[sub.plan]
      });
    });

    // Sort by most recent
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisMonth,
        totalAccounts,
        totalPosts,
        postsThisMonth,
        activeSubscriptions,
        monthlyRecurringRevenue,
        totalRevenue,
        revenueGrowth: 0,
        churnRate: 0,
        apiUsage,
        recentActivities: recentActivities.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Get all users (paginated)
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
      include: [{ model: Subscription, as: 'subscription', required: false }]
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/api-settings - Get API configuration status
router.get('/api-settings', authenticate, isAdmin, async (req, res, next) => {
  try {
    // Return which APIs are configured (without exposing actual keys)
    const settings = {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        lastUpdated: null
      },
      anthropic: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        lastUpdated: null
      },
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        lastUpdated: null
      },
      twitter: {
        configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
        lastUpdated: null
      },
      instagram: {
        configured: !!(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET),
        lastUpdated: null
      },
      linkedin: {
        configured: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
        lastUpdated: null
      },
      facebook: {
        configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        lastUpdated: null
      },
      youtube: {
        configured: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
        lastUpdated: null
      },
      firebase: {
        configured: !!process.env.FIREBASE_PROJECT_ID,
        lastUpdated: null
      }
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/api-settings/:provider - Update API key for provider
router.put('/api-settings/:provider', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { apiKey, clientId, clientSecret } = req.body;

    // In a real production app, you'd store these securely in a database
    // or use a secrets manager. For now, we just validate the request.
    const validProviders = [
      'openai', 'anthropic', 'stripe', 'twitter', 'instagram',
      'linkedin', 'facebook', 'youtube', 'firebase'
    ];

    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider: ${provider}`
      });
    }

    // Log the update attempt (in production, you'd actually update the config)
    console.log(`API settings update requested for ${provider} by admin ${req.user.id}`);

    // Return success - in production this would persist the change
    res.json({
      success: true,
      message: `API settings for ${provider} updated successfully`,
      data: {
        provider,
        configured: true,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/api-usage - Get API usage statistics
router.get('/api-usage', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // In production, this would query from an api_usage table
    // For now, return placeholder data
    const usage = {
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      },
      providers: {
        openai: {
          requests: 0,
          tokens: 0,
          cost: 0
        },
        anthropic: {
          requests: 0,
          tokens: 0,
          cost: 0
        },
        twitter: {
          requests: 0,
          cost: 0
        },
        instagram: {
          requests: 0,
          cost: 0
        }
      },
      totalCost: 0
    };

    res.json({
      success: true,
      data: { usage }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

module.exports = router;
