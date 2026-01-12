const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { SocialAccount } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// GET /api/accounts - List all connected accounts
router.get('/', authenticate, async (req, res, next) => {
  try {
    const accounts = await SocialAccount.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: [
        'id', 'platform', 'platformUsername', 'platformDisplayName',
        'profilePicture', 'isActive', 'lastSyncAt', 'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { accounts }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/accounts/:id - Get account details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    res.json({
      success: true,
      data: { account }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/accounts/:id - Update account settings
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    const { accountName, displayName, settings } = req.body;
    await account.update({
      ...(accountName && { platformDisplayName: accountName }),
      ...(displayName && { platformDisplayName: displayName }),
      ...(settings && { settings })
    });

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: { account }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/accounts/:id - Disconnect account
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    await account.update({ isActive: false });

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/accounts/:id/refresh - Refresh account token
router.post('/:id/refresh', authenticate, async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Token refresh logic varies by platform
    const PlatformService = require(`../services/platforms/${account.platform}`);
    const service = new PlatformService(account);

    const newTokens = await service.refreshToken();

    await account.update({
      accessToken: newTokens.accessToken,
      ...(newTokens.refreshToken && { refreshToken: newTokens.refreshToken }),
      tokenExpiresAt: newTokens.expiresAt
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/accounts/:id/analytics - Get account analytics
router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    const account = await SocialAccount.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Fetch analytics from platform
    const PlatformService = require(`../services/platforms/${account.platform}`);
    const service = new PlatformService(account);

    const analytics = await service.getAnalytics();

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
