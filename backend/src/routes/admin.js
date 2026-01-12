const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const { User, SocialAccount, Post, Subscription } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    // Demo mode: return mock admin stats
    if (req.user.isDemo) {
      return res.json({
        success: true,
        data: {
          totalUsers: 1250,
          newUsersThisMonth: 87,
          totalAccounts: 3420,
          totalPosts: 15780,
          postsThisMonth: 2340,
          activeSubscriptions: 456,
          monthlyRecurringRevenue: 12450.50,
          totalRevenue: 74703.00,
          revenueGrowth: 12.5,
          churnRate: 2.3,
          apiUsage: {
            openai: 3250,
            openaiCost: '32.50',
            instagram: 1850,
            instagramCost: 0,
            twitter: 1200,
            twitterCost: '75.00',
            linkedin: 650,
            linkedinCost: 0,
            totalCost: '107.50'
          },
          recentActivities: [
            { type: 'user', description: 'New user: john@example.com', time: '5m ago' },
            { type: 'subscription', description: 'jane@example.com subscribed to pro', time: '1h ago', amount: 29.99 },
            { type: 'user', description: 'New user: mike@company.co', time: '2h ago' },
            { type: 'subscription', description: 'startup@tech.io subscribed to business', time: '3h ago', amount: 99.99 }
          ]
        }
      });
    }

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

    // API usage (mock data for now)
    const apiUsage = {
      openai: Math.floor(Math.random() * 5000) + 1000,
      openaiCost: (Math.random() * 50 + 10).toFixed(2),
      instagram: Math.floor(Math.random() * 3000) + 500,
      instagramCost: 0,
      twitter: Math.floor(Math.random() * 2000) + 300,
      twitterCost: (Math.random() * 100 + 50).toFixed(2),
      linkedin: Math.floor(Math.random() * 1000) + 200,
      linkedinCost: 0,
      totalCost: 0
    };
    apiUsage.totalCost = (
      parseFloat(apiUsage.openaiCost) +
      parseFloat(apiUsage.twitterCost)
    ).toFixed(2);

    // Recent activities (simplified)
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
        revenueGrowth: 12.5, // Mock growth percentage
        churnRate: 2.3, // Mock churn rate
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

    // Demo mode: return mock users
    if (req.user.isDemo) {
      const demoUsers = [
        { id: 'user-1', email: 'john@example.com', firstName: 'John', lastName: 'Doe', role: 'user', isActive: true, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), subscription: { plan: 'pro', status: 'active' } },
        { id: 'user-2', email: 'jane@startup.io', firstName: 'Jane', lastName: 'Smith', role: 'user', isActive: true, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), subscription: { plan: 'business', status: 'active' } },
        { id: 'user-3', email: 'mike@company.co', firstName: 'Mike', lastName: 'Johnson', role: 'user', isActive: true, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), subscription: { plan: 'basic', status: 'active' } },
        { id: 'user-4', email: 'sarah@agency.com', firstName: 'Sarah', lastName: 'Wilson', role: 'user', isActive: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), subscription: { plan: 'pro', status: 'active' } },
        { id: 'user-5', email: 'admin@demo.com', firstName: 'Admin', lastName: 'User', role: 'admin', isActive: true, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), subscription: { plan: 'enterprise', status: 'active' } }
      ];

      return res.json({
        success: true,
        data: {
          users: demoUsers,
          pagination: { total: demoUsers.length, page: parseInt(page), pages: 1 }
        }
      });
    }

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
