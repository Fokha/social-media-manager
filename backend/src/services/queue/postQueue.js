const Bull = require('bull');
const { Post, SocialAccount, Notification } = require('../../models');
const logger = require('../../utils/logger');

// Create the queue
const postQueue = new Bull('post-publishing', process.env.REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    }
  }
});

// Process scheduled posts
postQueue.process('publish', async (job) => {
  const { postId } = job.data;

  logger.info(`Processing scheduled post: ${postId}`);

  try {
    const post = await Post.findByPk(postId, {
      include: [{ model: SocialAccount, as: 'socialAccount' }]
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.status === 'published') {
      logger.info(`Post ${postId} already published`);
      return { success: true, message: 'Already published' };
    }

    // Update status to publishing
    await post.update({ status: 'publishing' });

    // Get platform service
    const PlatformService = require(`../platforms/${post.socialAccount.platform}`);
    const service = new PlatformService(post.socialAccount);

    // Publish the post
    const result = await service.publishPost(post);

    // Update post with success
    await post.update({
      status: 'published',
      publishedAt: new Date(),
      platformPostId: result.id,
      platformPostUrl: result.url
    });

    // Create success notification
    await Notification.create({
      userId: post.userId,
      socialAccountId: post.socialAccountId,
      type: 'post_published',
      title: 'Post Published',
      message: `Your ${post.socialAccount.platform} post has been published successfully.`,
      link: result.url
    });

    logger.info(`Post ${postId} published successfully`);

    return { success: true, postId, url: result.url };
  } catch (error) {
    logger.error(`Failed to publish post ${postId}:`, error);

    // Update post with failure
    await Post.update(
      {
        status: 'failed',
        errorMessage: error.message,
        retryCount: Bull.sequelize.literal('retry_count + 1')
      },
      { where: { id: postId } }
    );

    const post = await Post.findByPk(postId);

    // Create failure notification
    await Notification.create({
      userId: post.userId,
      socialAccountId: post.socialAccountId,
      type: 'post_failed',
      title: 'Post Failed',
      message: `Failed to publish your ${post.socialAccount?.platform} post: ${error.message}`,
      priority: 'high'
    });

    throw error;
  }
});

// Event handlers
postQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

postQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed:`, error.message);
});

postQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

/**
 * Schedule a post for later publishing
 */
const schedulePost = async (post) => {
  const delay = new Date(post.scheduledAt).getTime() - Date.now();

  if (delay <= 0) {
    // Publish immediately
    return postQueue.add('publish', { postId: post.id });
  }

  return postQueue.add('publish', { postId: post.id }, {
    delay,
    jobId: `post-${post.id}`
  });
};

/**
 * Remove a scheduled post from the queue
 */
const removeScheduledPost = async (postId) => {
  const job = await postQueue.getJob(`post-${postId}`);
  if (job) {
    await job.remove();
    logger.info(`Removed scheduled post ${postId} from queue`);
  }
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    postQueue.getWaitingCount(),
    postQueue.getActiveCount(),
    postQueue.getCompletedCount(),
    postQueue.getFailedCount(),
    postQueue.getDelayedCount()
  ]);

  return { waiting, active, completed, failed, delayed };
};

/**
 * Retry failed posts
 */
const retryFailedPosts = async () => {
  const failedJobs = await postQueue.getFailed();

  for (const job of failedJobs) {
    if (job.attemptsMade < 3) {
      await job.retry();
      logger.info(`Retrying job ${job.id}`);
    }
  }
};

module.exports = {
  postQueue,
  schedulePost,
  removeScheduledPost,
  getQueueStats,
  retryFailedPosts
};
