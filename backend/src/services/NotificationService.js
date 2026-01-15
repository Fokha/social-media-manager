/**
 * Notification Service - Extends BaseCRUD with notification functionality
 */
const BaseCRUD = require('../templates/BaseCRUD');
const { Notification } = require('../models');

class NotificationService extends BaseCRUD {
  constructor() {
    super(Notification, {
      searchFields: ['title', 'message'],
      defaultSort: [['createdAt', 'DESC']],
      allowedFilters: ['type', 'isRead']
    });
  }

  /**
   * Get notifications for user with unread count
   */
  async getNotificationsForUser(userId, params = {}) {
    const { page = 1, limit = 20, unreadOnly } = params;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const result = await this.findAll({
      page,
      limit,
      where
    });

    // Get unread count
    const unreadCount = await this.count({ userId, isRead: false });

    return {
      ...result,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.findOne({ id: notificationId, userId });

    if (!notification) {
      return null;
    }

    return this.update(notificationId, { isRead: true });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    return this.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Create and optionally push notification
   */
  async createNotification(userId, data, pushService = null) {
    const notification = await this.create({
      userId,
      ...data
    });

    // Send push notification if service available
    if (pushService) {
      try {
        await pushService.sendNotification(userId, {
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link
        });
      } catch (e) {
        // Push might fail, but notification is still created
      }
    }

    return notification;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await this.findOne({ id: notificationId, userId });

    if (!notification) {
      return false;
    }

    return this.delete(notificationId);
  }

  /**
   * Create system notification for user
   */
  async systemNotify(userId, title, message, link = null) {
    return this.create({
      userId,
      type: 'system',
      title,
      message,
      link
    });
  }

  /**
   * Create post-related notification
   */
  async postNotify(userId, postId, type, message) {
    return this.create({
      userId,
      type: `post_${type}`,
      title: type === 'published' ? 'Post Published' : 'Post Update',
      message,
      link: `/dashboard/posts/${postId}`,
      metadata: { postId }
    });
  }

  /**
   * Create account-related notification
   */
  async accountNotify(userId, platform, type, message) {
    return this.create({
      userId,
      type: `account_${type}`,
      title: `${platform} Account`,
      message,
      link: '/dashboard/accounts',
      metadata: { platform }
    });
  }
}

module.exports = new NotificationService();
