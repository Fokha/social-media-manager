const axios = require('axios');
const { SocialAccount } = require('../models');
const { PLATFORMS } = require('../config/platforms');
const logger = require('../utils/logger');

/**
 * Token Refresh Service
 * Handles automatic token refresh for all platforms
 */

class TokenRefreshService {
  constructor() {
    this.refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiry
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(account) {
    if (!account.tokenExpiresAt) return false;
    const expiresAt = new Date(account.tokenExpiresAt).getTime();
    return Date.now() + this.refreshBuffer >= expiresAt;
  }

  /**
   * Refresh token for a specific account
   */
  async refreshToken(account) {
    const platform = account.platform;
    logger.info(`Refreshing token for ${platform} account ${account.id}`);

    try {
      let newTokens;

      switch (platform) {
        case 'youtube':
        case 'email':
          newTokens = await this.refreshGoogleToken(account);
          break;
        case 'twitter':
          newTokens = await this.refreshTwitterToken(account);
          break;
        case 'instagram':
          newTokens = await this.refreshFacebookToken(account);
          break;
        case 'linkedin':
          newTokens = await this.refreshLinkedInToken(account);
          break;
        case 'github':
          // GitHub tokens don't expire, but user might need to re-auth for scope changes
          logger.info('GitHub tokens do not expire');
          return null;
        default:
          logger.warn(`Token refresh not implemented for ${platform}`);
          return null;
      }

      if (newTokens) {
        await account.update({
          accessToken: newTokens.accessToken,
          ...(newTokens.refreshToken && { refreshToken: newTokens.refreshToken }),
          ...(newTokens.expiresAt && { tokenExpiresAt: newTokens.expiresAt })
        });
        logger.info(`Token refreshed successfully for ${platform} account ${account.id}`);
      }

      return newTokens;
    } catch (error) {
      logger.error(`Failed to refresh token for ${platform} account ${account.id}:`, error.message);

      // Mark account as inactive if refresh fails
      await account.update({ isActive: false });
      throw error;
    }
  }

  /**
   * Refresh Google OAuth token (YouTube, Gmail)
   */
  async refreshGoogleToken(account) {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token'
    });

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    };
  }

  /**
   * Refresh Twitter OAuth token
   */
  async refreshTwitterToken(account) {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    };
  }

  /**
   * Refresh Facebook/Instagram token
   */
  async refreshFacebookToken(account) {
    // Facebook long-lived tokens last 60 days, need to exchange before expiry
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: account.accessToken
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + (response.data.expires_in || 5184000) * 1000) // Default 60 days
    };
  }

  /**
   * Refresh LinkedIn token
   */
  async refreshLinkedInToken(account) {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || account.refreshToken,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    };
  }

  /**
   * Refresh all expiring tokens (for cron job)
   */
  async refreshAllExpiringTokens() {
    logger.info('Starting token refresh check for all accounts');

    const accounts = await SocialAccount.findAll({
      where: { isActive: true }
    });

    let refreshed = 0;
    let failed = 0;

    for (const account of accounts) {
      if (this.needsRefresh(account)) {
        try {
          await this.refreshToken(account);
          refreshed++;
        } catch (error) {
          failed++;
        }
      }
    }

    logger.info(`Token refresh complete: ${refreshed} refreshed, ${failed} failed`);
    return { refreshed, failed };
  }

  /**
   * Ensure account has valid token before making API calls
   */
  async ensureValidToken(account) {
    if (this.needsRefresh(account)) {
      await this.refreshToken(account);
      // Reload account to get updated token
      await account.reload();
    }
    return account;
  }
}

module.exports = new TokenRefreshService();
