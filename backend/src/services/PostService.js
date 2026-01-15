/**
 * Post Service - Extends BaseCRUD with post-specific functionality
 */
const BaseCRUD = require('../templates/BaseCRUD');
const { Post, SocialAccount, Subscription } = require('../models');
const { Op } = require('sequelize');

class PostService extends BaseCRUD {
  constructor() {
    super(Post, {
      searchFields: ['content'],
      defaultSort: [['createdAt', 'DESC']],
      allowedFilters: ['status', 'contentType'],
      defaultIncludes: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername', 'profilePicture']
      }]
    });
  }

  /**
   * Find all posts for a user with platform filter
   */
  async findAllForUser(userId, params = {}) {
    const { platform, ...otherParams } = params;

    const include = [...this.options.defaultIncludes];
    if (platform) {
      include[0].where = { platform };
    }

    return this.findAll({
      ...otherParams,
      where: { userId },
      include
    });
  }

  /**
   * Create post with subscription check
   */
  async createPost(userId, data, subscription) {
    // Check subscription limits
    if (subscription?.canCreatePost && !subscription.canCreatePost()) {
      const error = new Error('Post limit reached. Please upgrade your plan.');
      error.code = 'LIMIT_REACHED';
      throw error;
    }

    const status = data.scheduledAt ? 'scheduled' : 'draft';

    const post = await this.create({
      ...data,
      userId,
      status,
      contentType: data.contentType || 'text',
      mediaUrls: data.mediaUrls || [],
      hashtags: data.hashtags || [],
      mentions: data.mentions || [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null
    });

    // Update usage
    if (subscription) {
      await Subscription.increment('usage.postsThisMonth', {
        by: 1,
        where: { userId }
      });
    }

    return post;
  }

  /**
   * Publish post to platform
   */
  async publishPost(postId, userId) {
    const post = await this.model.findOne({
      where: { id: postId, userId },
      include: this.options.defaultIncludes
    });

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.status === 'published') {
      return { success: false, error: 'Post already published' };
    }

    await post.update({ status: 'publishing' });

    try {
      const PlatformService = require(`./platforms/${post.socialAccount.platform}`);
      const service = new PlatformService(post.socialAccount);
      const result = await service.publishPost(post);

      await post.update({
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id,
        platformPostUrl: result.url
      });

      return { success: true, post: this._formatResponse(post) };
    } catch (error) {
      await post.update({
        status: 'failed',
        errorMessage: error.message,
        retryCount: post.retryCount + 1
      });
      throw error;
    }
  }

  /**
   * Get posts for calendar view
   */
  async getCalendarPosts(userId, startDate, endDate) {
    return this.model.findAll({
      where: {
        userId,
        [Op.or]: [
          { scheduledAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } },
          { publishedAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
        ]
      },
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername']
      }]
    });
  }

  /**
   * Delete post with queue cleanup
   */
  async deletePost(postId, userId) {
    const post = await this.model.findOne({
      where: { id: postId, userId }
    });

    if (!post) {
      return false;
    }

    // Remove from queue if scheduled
    if (post.status === 'scheduled') {
      try {
        const postQueue = require('./queue/postQueue');
        await postQueue.removeScheduledPost(postId);
      } catch (e) {
        // Queue might not be configured
      }
    }

    await post.destroy();
    return true;
  }
}

module.exports = new PostService();
