const BasePlatform = require('./BasePlatform');
const { google } = require('googleapis');

class YouTubeService extends BasePlatform {
  constructor(account) {
    super(account);

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    this.oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken
    });

    this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
  }

  async refreshToken() {
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || this.account.refreshToken,
      expiresAt: new Date(credentials.expiry_date)
    };
  }

  async publishPost(post) {
    // YouTube posts are video uploads
    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('YouTube requires a video URL');
    }

    // For video uploads, we need the actual file
    // This is a simplified version - in production, handle file streaming
    const axios = require('axios');
    const { Readable } = require('stream');

    const videoResponse = await axios.get(post.mediaUrls[0], {
      responseType: 'stream'
    });

    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: post.metadata?.title || post.content?.substring(0, 100) || 'Untitled',
          description: post.content,
          tags: post.hashtags,
          categoryId: post.metadata?.categoryId || '22' // People & Blogs default
        },
        status: {
          privacyStatus: post.metadata?.privacy || 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: videoResponse.data
      }
    });

    return {
      id: response.data.id,
      url: `https://www.youtube.com/watch?v=${response.data.id}`
    };
  }

  async updateVideo(videoId, updates) {
    const response = await this.youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: updates
      }
    });

    return response.data;
  }

  async deleteVideo(videoId) {
    await this.youtube.videos.delete({ id: videoId });
    return true;
  }

  async getAnalytics() {
    // Get channel statistics
    const channelResponse = await this.youtube.channels.list({
      part: ['statistics', 'snippet'],
      mine: true
    });

    const channel = channelResponse.data.items[0];

    return {
      channelId: channel.id,
      title: channel.snippet.title,
      subscribers: parseInt(channel.statistics.subscriberCount),
      views: parseInt(channel.statistics.viewCount),
      videos: parseInt(channel.statistics.videoCount)
    };
  }

  async getVideoAnalytics(videoId) {
    const response = await this.youtube.videos.list({
      part: ['statistics'],
      id: [videoId]
    });

    const stats = response.data.items[0]?.statistics;

    return {
      views: parseInt(stats.viewCount || 0),
      likes: parseInt(stats.likeCount || 0),
      comments: parseInt(stats.commentCount || 0)
    };
  }

  async getComments(videoId, maxResults = 100) {
    const response = await this.youtube.commentThreads.list({
      part: ['snippet'],
      videoId,
      maxResults
    });

    return response.data.items.map(item => ({
      id: item.id,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      likeCount: item.snippet.topLevelComment.snippet.likeCount
    }));
  }

  async replyToComment(parentId, text) {
    const response = await this.youtube.comments.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          parentId,
          textOriginal: text
        }
      }
    });

    return response.data;
  }

  async getPlaylists() {
    const response = await this.youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    return response.data.items;
  }

  async createPlaylist(title, description, privacyStatus = 'public') {
    const response = await this.youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus }
      }
    });

    return response.data;
  }

  async addToPlaylist(playlistId, videoId) {
    const response = await this.youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId
          }
        }
      }
    });

    return response.data;
  }

  // YouTube doesn't have direct messaging
  async sendMessage() {
    throw new Error('YouTube does not support direct messaging');
  }
}

module.exports = YouTubeService;
