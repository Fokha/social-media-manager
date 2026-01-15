/**
 * Webhook Management Routes - CRUD for user webhooks
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Webhook } = require('../models');
const webhookService = require('../services/webhookService');
const { AppError } = require('../middleware/errorHandler');

/**
 * @route GET /api/webhook-endpoints
 * @desc Get all user webhooks
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const webhooks = await Webhook.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['secret'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { webhooks }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/webhook-endpoints
 * @desc Create a new webhook
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url) {
      throw new AppError('Name and URL are required', 400);
    }

    const webhook = await Webhook.create({
      userId: req.user.id,
      name,
      url,
      events: events || ['*']
    });

    res.status(201).json({
      success: true,
      data: {
        webhook: {
          ...webhook.toJSON(),
          secret: webhook.secret // Show secret only on creation
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/webhook-endpoints/:id
 * @desc Get a specific webhook
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({
      where: { id: req.params.id, userId: req.user.id },
      attributes: { exclude: ['secret'] }
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    res.json({ success: true, data: { webhook } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/webhook-endpoints/:id
 * @desc Update a webhook
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    const { name, url, events, isActive } = req.body;

    await webhook.update({
      ...(name && { name }),
      ...(url && { url }),
      ...(events && { events }),
      ...(typeof isActive === 'boolean' && { isActive })
    });

    res.json({
      success: true,
      data: {
        webhook: {
          ...webhook.toJSON(),
          secret: undefined
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/webhook-endpoints/:id
 * @desc Delete a webhook
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    await webhook.destroy();

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/webhook-endpoints/:id/test
 * @desc Send a test webhook
 */
router.post('/:id/test', authenticate, async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    const result = await webhookService.send(
      webhook.url,
      'webhook.test',
      {
        message: 'This is a test webhook',
        webhookId: webhook.id,
        triggeredBy: req.user.email
      },
      webhook.secret
    );

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/webhook-endpoints/:id/rotate-secret
 * @desc Rotate webhook secret
 */
router.post('/:id/rotate-secret', authenticate, async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!webhook) {
      throw new AppError('Webhook not found', 404);
    }

    const crypto = require('crypto');
    const newSecret = crypto.randomBytes(32).toString('hex');

    await webhook.update({ secret: newSecret });

    res.json({
      success: true,
      data: { secret: newSecret }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/webhook-endpoints/events
 * @desc Get available webhook events
 */
router.get('/events/list', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        events: Object.entries(webhookService.constructor.EVENTS).map(([key, value]) => ({
          key,
          event: value,
          description: key.replace(/_/g, ' ').toLowerCase()
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
