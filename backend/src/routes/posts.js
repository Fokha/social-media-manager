const express = require('express');
const router = express.Router();
const { authenticate, checkSubscription } = require('../middleware/auth');
const { Post, SocialAccount, Subscription } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// GET /api/posts - List all posts
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;

    // Demo mode: return mock posts
    if (req.user.isDemo) {
      const demoPosts = [
        {
          id: 'demo-post-1',
          content: '🚀 Excited to announce our new product launch! Stay tuned for more updates. #Innovation #NewProduct',
          contentType: 'text',
          status: 'published',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          socialAccount: { id: 'demo-twitter-1', platform: 'twitter', platformUsername: '@demo_brand' },
          analytics: { likes: 124, comments: 18, shares: 32 }
        },
        {
          id: 'demo-post-2',
          content: 'Behind the scenes at our office! Great team, great vibes. 💼✨ #TeamWork #CompanyCulture',
          contentType: 'image',
          status: 'published',
          publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          socialAccount: { id: 'demo-instagram-1', platform: 'instagram', platformUsername: 'demo.brand' },
          analytics: { likes: 256, comments: 42, shares: 15 }
        },
        {
          id: 'demo-post-3',
          content: 'Thrilled to share insights from our latest industry report. Key takeaways inside!',
          contentType: 'text',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          socialAccount: { id: 'demo-linkedin-1', platform: 'linkedin', platformUsername: 'Demo Brand Company' },
          analytics: null
        }
      ];

      return res.json({
        success: true,
        data: {
          posts: demoPosts,
          pagination: {
            total: demoPosts.length,
            page: parseInt(page),
            pages: 1
          }
        }
      });
    }

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const include = [{
      model: SocialAccount,
      as: 'socialAccount',
      attributes: ['id', 'platform', 'platformUsername', 'profilePicture']
    }];

    if (platform) {
      include[0].where = { platform };
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        posts,
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

// POST /api/posts - Create new post
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { socialAccountId, content, contentType, mediaUrls, scheduledAt, hashtags, mentions } = req.body;

    // Verify account belongs to user
    const account = await SocialAccount.findOne({
      where: { id: socialAccountId, userId: req.user.id, isActive: true }
    });

    if (!account) {
      throw new AppError('Social account not found', 404);
    }

    // Check subscription limits
    const subscription = req.user.subscription;
    if (!subscription.canCreatePost()) {
      throw new AppError('Post limit reached. Please upgrade your plan.', 403);
    }

    const status = scheduledAt ? 'scheduled' : 'draft';

    const post = await Post.create({
      userId: req.user.id,
      socialAccountId,
      content,
      contentType: contentType || 'text',
      mediaUrls: mediaUrls || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      hashtags: hashtags || [],
      mentions: mentions || [],
      status
    });

    // Update usage
    await Subscription.update(
      { 'usage.postsThisMonth': subscription.usage.postsThisMonth + 1 },
      { where: { userId: req.user.id } }
    );

    // If scheduled, add to queue
    if (scheduledAt) {
      const postQueue = require('../services/queue/postQueue');
      await postQueue.schedulePost(post);
    }

    res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/posts/:id/publish - Publish post immediately
router.post('/:id/publish', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: SocialAccount, as: 'socialAccount' }]
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.status === 'published') {
      throw new AppError('Post already published', 400);
    }

    // Publish to platform
    const PlatformService = require(`../services/platforms/${post.socialAccount.platform}`);
    const service = new PlatformService(post.socialAccount);

    await post.update({ status: 'publishing' });

    try {
      const result = await service.publishPost(post);

      await post.update({
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id,
        platformPostUrl: result.url
      });

      // Emit real-time notification
      const io = req.app.get('io');
      io.to(`user:${req.user.id}`).emit('post:published', { postId: post.id });

      res.json({
        success: true,
        data: { post }
      });
    } catch (publishError) {
      await post.update({
        status: 'failed',
        errorMessage: publishError.message,
        retryCount: post.retryCount + 1
      });
      throw publishError;
    }
  } catch (error) {
    next(error);
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.status === 'published') {
      throw new AppError('Cannot edit published post', 400);
    }

    const { content, contentType, mediaUrls, scheduledAt, hashtags, mentions } = req.body;

    await post.update({
      ...(content && { content }),
      ...(contentType && { contentType }),
      ...(mediaUrls && { mediaUrls }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt), status: 'scheduled' }),
      ...(hashtags && { hashtags }),
      ...(mentions && { mentions })
    });

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // If scheduled, remove from queue
    if (post.status === 'scheduled') {
      const postQueue = require('../services/queue/postQueue');
      await postQueue.removeScheduledPost(post.id);
    }

    await post.destroy();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/calendar - Get posts for calendar view
router.get('/calendar', authenticate, async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const posts = await Post.findAll({
      where: {
        userId: req.user.id,
        [Op.or]: [
          { scheduledAt: { [Op.between]: [new Date(start), new Date(end)] } },
          { publishedAt: { [Op.between]: [new Date(start), new Date(end)] } }
        ]
      },
      include: [{
        model: SocialAccount,
        as: 'socialAccount',
        attributes: ['id', 'platform', 'platformUsername']
      }]
    });

    res.json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
