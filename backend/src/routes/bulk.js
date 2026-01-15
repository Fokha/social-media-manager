/**
 * Bulk Operations Routes - Bulk post scheduling and management
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Post, SocialAccount, sequelize } = require('../models');
const { schedulePost } = require('../services/queue/postQueue');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * @route POST /api/bulk/posts
 * @desc Create multiple posts at once
 */
router.post('/posts', authenticate, async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { posts } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new AppError('Posts array is required', 400);
    }

    if (posts.length > 50) {
      throw new AppError('Maximum 50 posts per bulk operation', 400);
    }

    // Validate all accounts belong to user
    const accountIds = [...new Set(posts.map(p => p.socialAccountId))];
    const accounts = await SocialAccount.findAll({
      where: {
        id: accountIds,
        userId: req.user.id
      }
    });

    if (accounts.length !== accountIds.length) {
      throw new AppError('One or more accounts not found or unauthorized', 400);
    }

    const createdPosts = [];
    const errors = [];

    for (let i = 0; i < posts.length; i++) {
      const postData = posts[i];
      try {
        const post = await Post.create({
          userId: req.user.id,
          socialAccountId: postData.socialAccountId,
          content: postData.content,
          mediaUrls: postData.mediaUrls || [],
          scheduledAt: postData.scheduledAt || null,
          status: postData.scheduledAt ? 'scheduled' : 'draft',
          contentType: postData.contentType || 'post',
          hashtags: postData.hashtags || []
        }, { transaction });

        // Schedule if has scheduledAt
        if (post.scheduledAt) {
          await schedulePost(post);
        }

        createdPosts.push(post);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        created: createdPosts.length,
        failed: errors.length,
        posts: createdPosts,
        errors
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

/**
 * @route POST /api/bulk/schedule
 * @desc Bulk schedule existing draft posts
 */
router.post('/schedule', authenticate, async (req, res, next) => {
  try {
    const { postIds, schedules } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      throw new AppError('postIds array is required', 400);
    }

    // schedules can be an array of dates (one per post) or a single date for all
    const scheduleDates = Array.isArray(schedules) ? schedules : postIds.map(() => schedules);

    if (postIds.length !== scheduleDates.length) {
      throw new AppError('Number of schedules must match number of posts', 400);
    }

    const posts = await Post.findAll({
      where: {
        id: postIds,
        userId: req.user.id,
        status: { [Op.in]: ['draft', 'scheduled'] }
      }
    });

    if (posts.length !== postIds.length) {
      throw new AppError('Some posts not found or not in schedulable state', 400);
    }

    const results = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const scheduleDate = new Date(scheduleDates[i]);

      if (scheduleDate <= new Date()) {
        results.push({ postId: post.id, error: 'Schedule date must be in the future' });
        continue;
      }

      await post.update({ scheduledAt: scheduleDate, status: 'scheduled' });
      await schedulePost(post);
      results.push({ postId: post.id, scheduledAt: scheduleDate, success: true });
    }

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/bulk/posts
 * @desc Bulk delete posts
 */
router.delete('/posts', authenticate, async (req, res, next) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      throw new AppError('postIds array is required', 400);
    }

    const result = await Post.destroy({
      where: {
        id: postIds,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      data: { deleted: result }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/bulk/posts/status
 * @desc Bulk update post status
 */
router.put('/posts/status', authenticate, async (req, res, next) => {
  try {
    const { postIds, status } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      throw new AppError('postIds array is required', 400);
    }

    if (!['draft', 'scheduled', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const [updated] = await Post.update(
      { status },
      {
        where: {
          id: postIds,
          userId: req.user.id
        }
      }
    );

    res.json({
      success: true,
      data: { updated }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/bulk/crosspost
 * @desc Create the same post across multiple accounts
 */
router.post('/crosspost', authenticate, async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { content, accountIds, scheduledAt, mediaUrls, hashtags } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      throw new AppError('accountIds array is required', 400);
    }

    // Validate accounts
    const accounts = await SocialAccount.findAll({
      where: {
        id: accountIds,
        userId: req.user.id,
        isActive: true
      }
    });

    if (accounts.length === 0) {
      throw new AppError('No valid accounts found', 400);
    }

    const posts = [];
    for (const account of accounts) {
      const post = await Post.create({
        userId: req.user.id,
        socialAccountId: account.id,
        content,
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt || null,
        status: scheduledAt ? 'scheduled' : 'draft',
        hashtags: hashtags || []
      }, { transaction });

      if (post.scheduledAt) {
        await schedulePost(post);
      }

      posts.push({
        ...post.toJSON(),
        platform: account.platform
      });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        created: posts.length,
        posts
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

/**
 * @route POST /api/bulk/import
 * @desc Import posts from CSV/JSON
 */
router.post('/import', authenticate, async (req, res, next) => {
  try {
    const { posts, format = 'json' } = req.body;

    if (!Array.isArray(posts)) {
      throw new AppError('Posts array is required', 400);
    }

    // Map to internal format
    const mappedPosts = posts.map(p => ({
      socialAccountId: p.accountId || p.socialAccountId,
      content: p.content || p.text || p.message,
      scheduledAt: p.scheduledAt || p.scheduled_at || p.date,
      mediaUrls: p.mediaUrls || p.media || [],
      hashtags: p.hashtags || p.tags || []
    }));

    // Use the bulk create endpoint logic
    req.body = { posts: mappedPosts };
    return router.handle(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
