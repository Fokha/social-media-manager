const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Notification } = require('../models');
const pushService = require('../services/pushNotificationService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Initialize push notification service
pushService.initialize();

// GET /api/notifications - Get user notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const { rows: notifications, count } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.update({ isRead: true });

    res.json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// PUSH NOTIFICATION SUBSCRIPTION ENDPOINTS
// =============================================================================

// GET /api/notifications/push/vapid-key - Get VAPID public key
router.get('/push/vapid-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      error: 'Push notifications not configured'
    });
  }

  res.json({
    success: true,
    data: { publicKey }
  });
});

// POST /api/notifications/push/subscribe - Register push subscription
router.post('/push/subscribe', authenticate, async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      throw new AppError('Invalid subscription data', 400);
    }

    pushService.registerSubscription(req.user.id, subscription);

    res.json({
      success: true,
      message: 'Push subscription registered'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/push/unsubscribe - Remove push subscription
router.post('/push/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      throw new AppError('Endpoint required', 400);
    }

    pushService.removeSubscription(req.user.id, endpoint);

    res.json({
      success: true,
      message: 'Push subscription removed'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/push/test - Send test notification
router.post('/push/test', authenticate, async (req, res, next) => {
  try {
    const result = await pushService.sendNotification(req.user.id, {
      title: 'Test Notification',
      message: 'Push notifications are working!',
      type: 'system',
      link: '/dashboard'
    });

    res.json({
      success: true,
      message: `Test notification sent`,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
