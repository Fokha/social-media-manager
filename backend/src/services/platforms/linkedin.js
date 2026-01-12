const BasePlatform = require('./BasePlatform');
const axios = require('axios');

class LinkedInService extends BasePlatform {
  constructor(account) {
    super(account);
    this.apiBase = 'https://api.linkedin.com/v2';
    this.personUrn = `urn:li:person:${account.platformUserId}`;
  }

  async refreshToken() {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.account.refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    };
  }

  async publishPost(post) {
    const postData = {
      author: this.personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Handle media
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const mediaAssets = [];

      for (const url of post.mediaUrls) {
        const mediaAsset = await this.uploadMedia(url, post.contentType === 'video' ? 'VIDEO' : 'IMAGE');
        mediaAssets.push(mediaAsset);
      }

      postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory =
        post.contentType === 'video' ? 'VIDEO' : 'IMAGE';

      postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets.map(asset => ({
        status: 'READY',
        media: asset,
        title: { text: post.content?.substring(0, 100) || '' }
      }));
    }

    const response = await this.makeRequest('POST', `${this.apiBase}/ugcPosts`, postData);

    const postId = response.id.split(':').pop();

    return {
      id: response.id,
      url: `https://www.linkedin.com/feed/update/${response.id}`
    };
  }

  async uploadMedia(url, type = 'IMAGE') {
    // Step 1: Register upload
    const registerResponse = await this.makeRequest('POST', `${this.apiBase}/assets?action=registerUpload`, {
      registerUploadRequest: {
        recipes: [type === 'VIDEO' ? 'urn:li:digitalmediaRecipe:feedshare-video' : 'urn:li:digitalmediaRecipe:feedshare-image'],
        owner: this.personUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }]
      }
    });

    const uploadUrl = registerResponse.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResponse.value.asset;

    // Step 2: Download and upload the media
    const mediaResponse = await axios.get(url, { responseType: 'arraybuffer' });
    await axios.put(uploadUrl, mediaResponse.data, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': mediaResponse.headers['content-type']
      }
    });

    return asset;
  }

  async sendMessage({ recipientId, content }) {
    // LinkedIn messaging requires specific API access
    const response = await this.makeRequest('POST', `${this.apiBase}/messages`, {
      recipients: [recipientId],
      subject: 'Message',
      body: content
    });

    return {
      messageId: response.id,
      conversationId: recipientId
    };
  }

  async getAnalytics() {
    // Get organization analytics if available, otherwise personal
    const response = await this.makeRequest(
      'GET',
      `${this.apiBase}/networkSizes/${this.personUrn}?edgeType=CompanyFollowedByMember`
    );

    return {
      connections: response.firstDegreeSize,
      followers: response.followerCount || 0
    };
  }

  async getPostAnalytics(postUrn) {
    const response = await this.makeRequest(
      'GET',
      `${this.apiBase}/socialActions/${postUrn}`
    );

    return {
      likes: response.likesSummary?.totalLikes || 0,
      comments: response.commentsSummary?.totalFirstLevelComments || 0,
      shares: response.sharesSummary?.totalShares || 0
    };
  }

  async publishArticle(title, body, thumbnailUrl) {
    const articleData = {
      author: this.personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ArticleContent': {
          article: {
            title: { text: title },
            description: { text: body.substring(0, 200) },
            source: body
          }
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await this.makeRequest('POST', `${this.apiBase}/ugcPosts`, articleData);
    return response;
  }
}

module.exports = LinkedInService;
