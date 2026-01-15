/**
 * Account Service - Extends BaseCRUD with social account functionality
 */
const BaseCRUD = require('../templates/BaseCRUD');
const { SocialAccount, Subscription } = require('../models');

class AccountService extends BaseCRUD {
  constructor() {
    super(SocialAccount, {
      searchFields: ['platformUsername', 'platformDisplayName'],
      defaultSort: [['createdAt', 'DESC']],
      allowedFilters: ['platform', 'isActive'],
      excludeFields: ['accessToken', 'refreshToken'] // Never expose tokens
    });
  }

  /**
   * Get all active accounts for a user
   */
  async getActiveAccounts(userId) {
    return this.model.findAll({
      where: { userId, isActive: true },
      attributes: [
        'id', 'platform', 'platformUsername', 'platformDisplayName',
        'profilePicture', 'isActive', 'lastSyncAt', 'createdAt'
      ],
      order: this.options.defaultSort
    });
  }

  /**
   * Get account with ownership check
   */
  async getAccountForUser(accountId, userId) {
    return this.findOne({ id: accountId, userId });
  }

  /**
   * Connect new social account
   */
  async connectAccount(userId, accountData, subscription) {
    // Check subscription limits
    if (subscription?.canAddSocialAccount && !subscription.canAddSocialAccount()) {
      const error = new Error('Social account limit reached. Please upgrade your plan.');
      error.code = 'LIMIT_REACHED';
      throw error;
    }

    const [account, created] = await this.model.findOrCreate({
      where: {
        userId,
        platform: accountData.platform,
        platformUserId: accountData.platformUserId
      },
      defaults: {
        accessToken: accountData.accessToken,
        refreshToken: accountData.refreshToken,
        tokenExpiresAt: accountData.tokenExpiresAt,
        platformUsername: accountData.platformUsername,
        platformDisplayName: accountData.platformDisplayName,
        profilePicture: accountData.profilePicture,
        metadata: accountData.metadata,
        isActive: true
      }
    });

    if (!created) {
      // Update existing account tokens
      await account.update({
        accessToken: accountData.accessToken,
        ...(accountData.refreshToken && { refreshToken: accountData.refreshToken }),
        tokenExpiresAt: accountData.tokenExpiresAt,
        isActive: true
      });
    } else {
      // Update subscription usage
      await Subscription.increment('usage.socialAccounts', {
        by: 1,
        where: { userId }
      });
    }

    return { account: this._formatResponse(account), created };
  }

  /**
   * Disconnect account (soft delete)
   */
  async disconnectAccount(accountId, userId) {
    const account = await this.model.findOne({
      where: { id: accountId, userId }
    });

    if (!account) {
      return false;
    }

    await account.update({ isActive: false });
    return true;
  }

  /**
   * Refresh account token
   */
  async refreshAccountToken(accountId, userId) {
    const account = await this.model.findOne({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const PlatformService = require(`./platforms/${account.platform}`);
    const service = new PlatformService(account);

    const newTokens = await service.refreshToken();

    await account.update({
      accessToken: newTokens.accessToken,
      ...(newTokens.refreshToken && { refreshToken: newTokens.refreshToken }),
      tokenExpiresAt: newTokens.expiresAt
    });

    return { success: true };
  }

  /**
   * Get account analytics
   */
  async getAnalytics(accountId, userId) {
    const account = await this.model.findOne({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const PlatformService = require(`./platforms/${account.platform}`);
    const service = new PlatformService(account);

    return service.getAnalytics();
  }
}

module.exports = new AccountService();
