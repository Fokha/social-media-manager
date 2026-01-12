const webpush = require('web-push');
const logger = require('../utils/logger');

/**
 * Push Notification Service
 * Handles Web Push notifications for browser clients
 */

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.subscriptions = new Map(); // userId -> subscription[]
  }

  /**
   * Initialize VAPID keys for Web Push
   */
  initialize() {
    if (this.initialized) return;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
      logger.warn('VAPID keys not configured - push notifications disabled');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.initialized = true;
    logger.info('Push notification service initialized');
  }

  /**
   * Generate VAPID keys (run once during setup)
   */
  static generateVapidKeys() {
    const keys = webpush.generateVAPIDKeys();
    console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
    console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
    return keys;
  }

  /**
   * Register a push subscription for a user
   */
  registerSubscription(userId, subscription) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, []);
    }

    const userSubs = this.subscriptions.get(userId);

    // Avoid duplicate subscriptions
    const exists = userSubs.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      userSubs.push(subscription);
      logger.info(`Push subscription registered for user ${userId}`);
    }

    return true;
  }

  /**
   * Remove a push subscription
   */
  removeSubscription(userId, endpoint) {
    if (!this.subscriptions.has(userId)) return;

    const userSubs = this.subscriptions.get(userId);
    const filtered = userSubs.filter(s => s.endpoint !== endpoint);
    this.subscriptions.set(userId, filtered);

    logger.info(`Push subscription removed for user ${userId}`);
  }

  /**
   * Send push notification to a user
   */
  async sendNotification(userId, notification) {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized');
      return { sent: 0, failed: 0 };
    }

    const subscriptions = this.subscriptions.get(userId) || [];
    if (subscriptions.length === 0) {
      logger.debug(`No push subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: notification.icon || '/icons/notification-icon.png',
      badge: notification.badge || '/icons/badge-icon.png',
      data: {
        url: notification.link || '/',
        type: notification.type,
        id: notification.id
      },
      actions: notification.actions || []
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (error) {
        failed++;
        logger.error(`Push notification failed:`, error.message);

        // Remove invalid subscriptions (410 Gone or 404)
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.removeSubscription(userId, subscription.endpoint);
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds, notification) {
    const results = { sent: 0, failed: 0 };

    for (const userId of userIds) {
      const result = await this.sendNotification(userId, notification);
      results.sent += result.sent;
      results.failed += result.failed;
    }

    return results;
  }

  /**
   * Send broadcast notification to all users
   */
  async broadcast(notification) {
    const allUserIds = Array.from(this.subscriptions.keys());
    return this.sendToUsers(allUserIds, notification);
  }
}

// Notification type constants
PushNotificationService.TYPES = {
  NEW_MESSAGE: 'new_message',
  NEW_FOLLOWER: 'new_follower',
  NEW_COMMENT: 'new_comment',
  POST_PUBLISHED: 'post_published',
  POST_FAILED: 'post_failed',
  SUBSCRIPTION_REMINDER: 'subscription_reminder',
  SYSTEM: 'system'
};

module.exports = new PushNotificationService();
