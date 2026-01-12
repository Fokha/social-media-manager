const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');
const { AppError } = require('./errorHandler');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Demo mode: If no token, empty token, or demo-token provided, use demo user
    if (!token || token === 'demo-token' || token === 'null' || token === 'undefined') {
      // Create a demo user object with mock subscription
      // Using a valid UUID format for demo user
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@socialmanager.com',
        name: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        isActive: true,
        isDemo: true, // Flag to identify demo user
        subscription: {
          plan: 'pro',
          usage: { aiCreditsUsed: 0, accounts: 0, postsThisMonth: 0 },
          limits: { aiCredits: 50, accounts: 10, postsPerMonth: 100 },
          canUseAI: () => true
        }
      };
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Subscription, as: 'subscription' }]
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this resource', 403));
    }
    next();
  };
};

const checkSubscription = (requiredPlan = 'free') => {
  const planLevels = ['free', 'basic', 'pro', 'business', 'enterprise'];

  return (req, res, next) => {
    const userPlan = req.user.subscription?.plan || 'free';
    const userLevel = planLevels.indexOf(userPlan);
    const requiredLevel = planLevels.indexOf(requiredPlan);

    if (userLevel < requiredLevel) {
      return next(new AppError(`This feature requires ${requiredPlan} plan or higher`, 403));
    }
    next();
  };
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

module.exports = { authenticate, authorize, checkSubscription, generateToken, isAdmin };
