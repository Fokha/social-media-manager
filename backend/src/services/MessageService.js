/**
 * Message Service - Extends BaseCRUD with messaging functionality
 */
const BaseCRUD = require('../templates/BaseCRUD');
const { Message, SocialAccount } = require('../models');
const { Op } = require('sequelize');

class MessageService extends BaseCRUD {
  constructor() {
    super(Message, {
      searchFields: ['content', 'senderName'],
      defaultSort: [['platformTimestamp', 'DESC']],
      allowedFilters: ['direction', 'messageType', 'isRead'],
      defaultIncludes: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername', 'profilePicture']
      }]
    });
  }

  /**
   * Get user's account IDs helper
   */
  async getUserAccountIds(userId, filters = {}) {
    const where = { userId, isActive: true };
    if (filters.platform) where.platform = filters.platform;
    if (filters.accountId) where.id = filters.accountId;

    const accounts = await SocialAccount.findAll({
      where,
      attributes: ['id']
    });

    return accounts.map(a => a.id);
  }

  /**
   * Get messages for user
   */
  async getMessagesForUser(userId, params = {}) {
    const { platform, accountId, unreadOnly, page = 1, limit = 50 } = params;

    const accountIds = await this.getUserAccountIds(userId, { platform, accountId });

    const where = { socialAccountId: { [Op.in]: accountIds } };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      include: this.options.defaultIncludes,
      order: this.options.defaultSort,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      messages: rows.map(r => this._formatResponse(r)),
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    };
  }

  /**
   * Get grouped conversations
   */
  async getConversations(userId, platform = null) {
    const accountIds = await this.getUserAccountIds(userId, { platform });

    return this.model.findAll({
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
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(userId, conversationId, params = {}) {
    const { page = 1, limit = 50 } = params;

    const accountIds = await this.getUserAccountIds(userId);

    const messages = await this.model.findAll({
      where: {
        conversationId,
        socialAccountId: { [Op.in]: accountIds }
      },
      include: this.options.defaultIncludes,
      order: [['platformTimestamp', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Mark incoming messages as read
    await this.model.update(
      { isRead: true },
      {
        where: {
          conversationId,
          isRead: false,
          direction: 'incoming'
        }
      }
    );

    return messages.map(m => this._formatResponse(m));
  }

  /**
   * Send a message
   */
  async sendMessage(userId, data) {
    const { socialAccountId, recipientId, content, messageType = 'text', mediaUrl } = data;

    const account = await SocialAccount.findOne({
      where: { id: socialAccountId, userId, isActive: true }
    });

    if (!account) {
      throw new Error('Social account not found');
    }

    // Send via platform service
    const PlatformService = require(`./platforms/${account.platform}`);
    const service = new PlatformService(account);

    const result = await service.sendMessage({
      recipientId,
      content,
      messageType,
      mediaUrl
    });

    // Store sent message
    return this.create({
      userId,
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
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const accountIds = await this.getUserAccountIds(userId);

    return this.model.count({
      where: {
        socialAccountId: { [Op.in]: accountIds },
        isRead: false,
        direction: 'incoming'
      }
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, userId) {
    const accountIds = await this.getUserAccountIds(userId);

    const message = await this.model.findOne({
      where: {
        id: messageId,
        socialAccountId: { [Op.in]: accountIds }
      }
    });

    if (!message) {
      return null;
    }

    await message.update({ isRead: true });
    return this._formatResponse(message);
  }
}

module.exports = new MessageService();
