const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Message, SocialAccount } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// GET /api/messages - List conversations/messages
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { platform, accountId, unreadOnly, page = 1, limit = 50 } = req.query;

    const accountWhere = { userId: req.user.id, isActive: true };
    if (platform) accountWhere.platform = platform;
    if (accountId) accountWhere.id = accountId;

    const accounts = await SocialAccount.findAll({
      where: accountWhere,
      attributes: ['id']
    });

    const accountIds = accounts.map(a => a.id);

    const messageWhere = {
      socialAccountId: { [Op.in]: accountIds }
    };
    if (unreadOnly === 'true') {
      messageWhere.isRead = false;
    }

    // Get unique conversations
    const { count, rows: messages } = await Message.findAndCountAll({
      where: messageWhere,
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername', 'profilePicture']
      }],
      order: [['platformTimestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/conversations - Get grouped conversations
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.query;

    const accountWhere = { userId: req.user.id, isActive: true };
    if (platform) accountWhere.platform = platform;

    const accounts = await SocialAccount.findAll({
      where: accountWhere,
      attributes: ['id']
    });

    const accountIds = accounts.map(a => a.id);

    // Get latest message from each conversation
    const conversations = await Message.findAll({
      where: {
        socialAccountId: { [Op.in]: accountIds }
      },
      attributes: [
        'conversationId',
        'senderId',
        'senderName',
        'senderAvatar',
        [Message.sequelize.fn('MAX', Message.sequelize.col('Message.platform_timestamp')), 'lastMessageTime'],
        [Message.sequelize.fn('COUNT', Message.sequelize.col('Message.id')), 'messageCount'],
        [Message.sequelize.fn('SUM', Message.sequelize.literal('CASE WHEN "Message".is_read = false THEN 1 ELSE 0 END')), 'unreadCount']
      ],
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername']
      }],
      group: ['Message.conversationId', 'Message.senderId', 'Message.senderName', 'Message.senderAvatar', 'socialAccount.id', 'socialAccount.platform', 'socialAccount.platform_username'],
      order: [[Message.sequelize.fn('MAX', Message.sequelize.col('Message.platform_timestamp')), 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/conversation/:conversationId - Get messages in conversation
router.get('/conversation/:conversationId', authenticate, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user has access
    const accounts = await SocialAccount.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });

    const messages = await Message.findAll({
      where: {
        conversationId,
        socialAccountId: { [Op.in]: accounts.map(a => a.id) }
      },
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername']
      }],
      order: [['platformTimestamp', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Mark as read
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          isRead: false,
          direction: 'incoming'
        }
      }
    );

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/send - Send a message
router.post('/send', authenticate, async (req, res, next) => {
  try {
    const { socialAccountId, recipientId, content, messageType = 'text', mediaUrl } = req.body;

    const account = await SocialAccount.findOne({
      where: { id: socialAccountId, userId: req.user.id, isActive: true }
    });

    if (!account) {
      throw new AppError('Social account not found', 404);
    }

    // Send via platform service
    const PlatformService = require(`../services/platforms/${account.platform}`);
    const service = new PlatformService(account);

    const result = await service.sendMessage({
      recipientId,
      content,
      messageType,
      mediaUrl
    });

    // Store sent message
    const message = await Message.create({
      userId: req.user.id,
      socialAccountId,
      conversationId: result.conversationId || recipientId,
      platformMessageId: result.messageId,
      direction: 'outgoing',
      senderId: account.platformUserId,
      senderName: account.platformDisplayName,
      recipientId,
      messageType,
      content,
      mediaUrl,
      isRead: true,
      platformTimestamp: new Date()
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user:${req.user.id}`).emit('message:sent', { message });

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.id },
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        where: { userId: req.user.id }
      }]
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    await message.update({ isRead: true });

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    // Demo mode - return mock unread count
    if (req.user.isDemo) {
      return res.json({
        success: true,
        data: { unreadCount: 5 }
      });
    }

    const accounts = await SocialAccount.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: ['id']
    });

    const count = await Message.count({
      where: {
        socialAccountId: { [Op.in]: accounts.map(a => a.id) },
        isRead: false,
        direction: 'incoming'
      }
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
