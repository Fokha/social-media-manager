const BasePlatform = require('./BasePlatform');
const { TwitterApi } = require('twitter-api-v2');

class TwitterService extends BasePlatform {
  constructor(account) {
    super(account);
    this.client = new TwitterApi(account.accessToken);
    this.v2 = this.client.v2;
  }

  async refreshToken() {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const { accessToken, refreshToken, expiresIn } = await client.refreshOAuth2Token(
      this.account.refreshToken
    );

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  }

  async publishPost(post) {
    let mediaIds = [];

    // Upload media if present
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      for (const url of post.mediaUrls) {
        const mediaId = await this.uploadMedia(url);
        mediaIds.push(mediaId);
      }
    }

    // Create tweet
    const tweetParams = {
      text: post.content
    };

    if (mediaIds.length > 0) {
      tweetParams.media = { media_ids: mediaIds };
    }

    const response = await this.v2.tweet(tweetParams);

    return {
      id: response.data.id,
      url: `https://twitter.com/i/status/${response.data.id}`
    };
  }

  async uploadMedia(url) {
    // Download media and upload to Twitter
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const mediaId = await this.client.v1.uploadMedia(buffer, {
      mimeType: response.headers['content-type']
    });

    return mediaId;
  }

  async createThread(posts) {
    const tweets = [];
    let replyToId = null;

    for (const content of posts) {
      const params = { text: content };

      if (replyToId) {
        params.reply = { in_reply_to_tweet_id: replyToId };
      }

      const response = await this.v2.tweet(params);
      tweets.push(response.data);
      replyToId = response.data.id;
    }

    return tweets;
  }

  async sendMessage({ recipientId, content }) {
    const response = await this.v2.sendDmToParticipant(recipientId, {
      text: content
    });

    return {
      messageId: response.dm_event_id,
      conversationId: response.dm_conversation_id
    };
  }

  async getAnalytics() {
    // Get user metrics
    const user = await this.v2.me({
      'user.fields': ['public_metrics', 'created_at']
    });

    return {
      followers: user.data.public_metrics.followers_count,
      following: user.data.public_metrics.following_count,
      tweets: user.data.public_metrics.tweet_count,
      listed: user.data.public_metrics.listed_count
    };
  }

  async getTweetAnalytics(tweetId) {
    const tweet = await this.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'organic_metrics']
    });

    return tweet.data.public_metrics;
  }

  async searchMentions() {
    const mentions = await this.v2.userMentionTimeline(this.platformUserId);
    return mentions.data;
  }

  async replyToTweet(tweetId, content) {
    const response = await this.v2.tweet({
      text: content,
      reply: { in_reply_to_tweet_id: tweetId }
    });
    return response.data;
  }
}

module.exports = TwitterService;
