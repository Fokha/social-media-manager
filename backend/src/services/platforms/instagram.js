const BasePlatform = require('./BasePlatform');
const axios = require('axios');

class InstagramService extends BasePlatform {
  constructor(account) {
    super(account);
    this.apiBase = 'https://graph.facebook.com/v18.0';
    this.pageAccessToken = account.accessToken;
  }

  async refreshToken() {
    // Facebook/Instagram tokens are long-lived and need to be refreshed
    const response = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: this.accessToken
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    };
  }

  async publishPost(post) {
    // Step 1: Create media container
    const containerParams = {
      access_token: this.pageAccessToken
    };

    if (post.contentType === 'image' && post.mediaUrls.length > 0) {
      containerParams.image_url = post.mediaUrls[0];
      containerParams.caption = post.content;
    } else if (post.contentType === 'video' && post.mediaUrls.length > 0) {
      containerParams.media_type = 'VIDEO';
      containerParams.video_url = post.mediaUrls[0];
      containerParams.caption = post.content;
    } else if (post.contentType === 'carousel' && post.mediaUrls.length > 1) {
      // Create carousel children first
      const children = [];
      for (const url of post.mediaUrls) {
        const childResponse = await this.makeRequest(
          'POST',
          `${this.apiBase}/${this.platformUserId}/media`,
          {
            image_url: url,
            is_carousel_item: true,
            access_token: this.pageAccessToken
          }
        );
        children.push(childResponse.id);
      }
      containerParams.media_type = 'CAROUSEL';
      containerParams.children = children.join(',');
      containerParams.caption = post.content;
    } else if (post.contentType === 'reel' && post.mediaUrls.length > 0) {
      containerParams.media_type = 'REELS';
      containerParams.video_url = post.mediaUrls[0];
      containerParams.caption = post.content;
    } else {
      throw new Error('Instagram requires media for posts');
    }

    // Create the container
    const containerResponse = await this.makeRequest(
      'POST',
      `${this.apiBase}/${this.platformUserId}/media`,
      containerParams
    );

    // Step 2: Wait for processing if video
    if (['video', 'reel'].includes(post.contentType)) {
      await this.waitForMediaProcessing(containerResponse.id);
    }

    // Step 3: Publish
    const publishResponse = await this.makeRequest(
      'POST',
      `${this.apiBase}/${this.platformUserId}/media_publish`,
      {
        creation_id: containerResponse.id,
        access_token: this.pageAccessToken
      }
    );

    // Get permalink
    const mediaInfo = await this.makeRequest(
      'GET',
      `${this.apiBase}/${publishResponse.id}?fields=permalink&access_token=${this.pageAccessToken}`
    );

    return {
      id: publishResponse.id,
      url: mediaInfo.permalink
    };
  }

  async waitForMediaProcessing(containerId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.makeRequest(
        'GET',
        `${this.apiBase}/${containerId}?fields=status_code&access_token=${this.pageAccessToken}`
      );

      if (status.status_code === 'FINISHED') {
        return true;
      } else if (status.status_code === 'ERROR') {
        throw new Error('Media processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Media processing timeout');
  }

  async sendMessage({ recipientId, content }) {
    const response = await this.makeRequest(
      'POST',
      `${this.apiBase}/${this.platformUserId}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: content },
        access_token: this.pageAccessToken
      }
    );

    return {
      messageId: response.message_id,
      conversationId: recipientId
    };
  }

  async getAnalytics() {
    const metrics = await this.makeRequest(
      'GET',
      `${this.apiBase}/${this.platformUserId}/insights`,
      null,
      {
        params: {
          metric: 'impressions,reach,profile_views,follower_count',
          period: 'day',
          access_token: this.pageAccessToken
        }
      }
    );

    return metrics.data;
  }

  async getComments(mediaId) {
    const comments = await this.makeRequest(
      'GET',
      `${this.apiBase}/${mediaId}/comments?access_token=${this.pageAccessToken}`
    );
    return comments.data;
  }

  async replyToComment(commentId, message) {
    const response = await this.makeRequest(
      'POST',
      `${this.apiBase}/${commentId}/replies`,
      {
        message,
        access_token: this.pageAccessToken
      }
    );
    return response;
  }
}

module.exports = InstagramService;
