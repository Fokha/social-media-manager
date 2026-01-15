/**
 * Webhook Service - Outgoing webhook notifications
 */
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class WebhookService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generate signature for webhook payload
   */
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Verify incoming webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  /**
   * Send webhook notification
   */
  async send(url, event, data, secret = null) {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': payload.timestamp,
      'X-Webhook-ID': payload.id
    };

    if (secret) {
      headers['X-Webhook-Signature'] = this.generateSignature(payload, secret);
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(url, payload, {
          headers,
          timeout: 10000
        });

        logger.info(`Webhook sent: ${event} to ${url} (attempt ${attempt})`);

        return {
          success: true,
          statusCode: response.status,
          webhookId: payload.id
        };
      } catch (error) {
        logger.warn(`Webhook failed: ${event} to ${url} (attempt ${attempt}): ${error.message}`);

        if (attempt === this.retryAttempts) {
          logger.error(`Webhook exhausted retries: ${event} to ${url}`);
          return {
            success: false,
            error: error.message,
            webhookId: payload.id
          };
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  /**
   * Send webhook to multiple URLs
   */
  async broadcast(urls, event, data, secret = null) {
    const results = await Promise.allSettled(
      urls.map(url => this.send(url, event, data, secret))
    );

    return results.map((result, index) => ({
      url: urls[index],
      ...(result.status === 'fulfilled' ? result.value : { success: false, error: result.reason })
    }));
  }

  // ============================================================================
  // Event Types
  // ============================================================================

  static EVENTS = {
    // Post events
    POST_CREATED: 'post.created',
    POST_PUBLISHED: 'post.published',
    POST_FAILED: 'post.failed',
    POST_SCHEDULED: 'post.scheduled',
    POST_DELETED: 'post.deleted',

    // Account events
    ACCOUNT_CONNECTED: 'account.connected',
    ACCOUNT_DISCONNECTED: 'account.disconnected',
    ACCOUNT_TOKEN_REFRESHED: 'account.token_refreshed',
    ACCOUNT_TOKEN_EXPIRED: 'account.token_expired',

    // Message events
    MESSAGE_RECEIVED: 'message.received',
    MESSAGE_SENT: 'message.sent',

    // Subscription events
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',

    // User events
    USER_REGISTERED: 'user.registered',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted'
  };

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  async notifyPostPublished(webhookUrl, post, secret) {
    return this.send(webhookUrl, WebhookService.EVENTS.POST_PUBLISHED, {
      postId: post.id,
      platform: post.socialAccount?.platform,
      platformPostId: post.platformPostId,
      platformPostUrl: post.platformPostUrl,
      publishedAt: post.publishedAt
    }, secret);
  }

  async notifyPostFailed(webhookUrl, post, error, secret) {
    return this.send(webhookUrl, WebhookService.EVENTS.POST_FAILED, {
      postId: post.id,
      platform: post.socialAccount?.platform,
      error: error.message || error
    }, secret);
  }

  async notifyAccountConnected(webhookUrl, account, secret) {
    return this.send(webhookUrl, WebhookService.EVENTS.ACCOUNT_CONNECTED, {
      accountId: account.id,
      platform: account.platform,
      username: account.platformUsername
    }, secret);
  }

  async notifySubscriptionUpdated(webhookUrl, subscription, secret) {
    return this.send(webhookUrl, WebhookService.EVENTS.SUBSCRIPTION_UPDATED, {
      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status
    }, secret);
  }
}

module.exports = new WebhookService();
