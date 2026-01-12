const express = require('express');
const router = express.Router();
const { User, Subscription } = require('../models');
const { authenticate, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password, firstName, lastName } = value;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Create free subscription
    await Subscription.create({
      userId: user.id,
      plan: 'free',
      limits: Subscription.PLAN_LIMITS.free,
      usage: {
        socialAccounts: 0,
        postsThisMonth: 0,
        aiCreditsUsed: 0,
        teamMembers: 1
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password } = value;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Subscription, as: 'subscription' }]
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Subscription, as: 'subscription' }]
    });

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, avatar, settings } = req.body;

    await req.user.update({
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(avatar && { avatar }),
      ...(settings && { settings: { ...req.user.settings, ...settings } })
    });

    res.json({
      success: true,
      data: { user: req.user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const isValid = await req.user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // But we can add token blacklisting with Redis if needed
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
