/**
 * Platform Configuration
 * Defines OAuth settings and API endpoints for all supported platforms
 */

const PLATFORMS = {
  YOUTUBE: {
    name: 'YouTube',
    key: 'youtube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBase: 'https://www.googleapis.com/youtube/v3',
    scopes: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    features: ['post', 'analytics', 'comments', 'upload_video']
  },

  INSTAGRAM: {
    name: 'Instagram',
    key: 'instagram',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiBase: 'https://graph.facebook.com/v18.0',
    scopes: [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement'
    ],
    features: ['post', 'stories', 'reels', 'messages', 'comments']
  },

  TWITTER: {
    name: 'X (Twitter)',
    key: 'twitter',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    apiBase: 'https://api.twitter.com/2',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'dm.read',
      'dm.write',
      'offline.access'
    ],
    features: ['post', 'messages', 'analytics', 'threads']
  },

  LINKEDIN: {
    name: 'LinkedIn',
    key: 'linkedin',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiBase: 'https://api.linkedin.com/v2',
    scopes: [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'r_organization_social',
      'w_organization_social'
    ],
    features: ['post', 'articles', 'analytics', 'company_pages']
  },

  SNAPCHAT: {
    name: 'Snapchat',
    key: 'snapchat',
    authUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
    tokenUrl: 'https://accounts.snapchat.com/login/oauth2/access_token',
    apiBase: 'https://adsapi.snapchat.com/v1',
    scopes: [
      'snapchat-marketing-api'
    ],
    features: ['ads', 'analytics', 'stories']
  },

  WHATSAPP: {
    name: 'WhatsApp Business',
    key: 'whatsapp',
    apiBase: 'https://graph.facebook.com/v18.0',
    features: ['messages', 'templates', 'media'],
    requiresApproval: true
  },

  TELEGRAM: {
    name: 'Telegram',
    key: 'telegram',
    apiBase: 'https://api.telegram.org',
    features: ['messages', 'channels', 'groups', 'bots']
  },

  GITHUB: {
    name: 'GitHub',
    key: 'github',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    apiBase: 'https://api.github.com',
    scopes: [
      'repo',
      'user',
      'read:org',
      'notifications'
    ],
    features: ['repos', 'issues', 'notifications', 'releases']
  },

  EMAIL: {
    name: 'Email',
    key: 'email',
    providers: {
      gmail: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        apiBase: 'https://gmail.googleapis.com/gmail/v1',
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify'
        ]
      },
      outlook: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        apiBase: 'https://graph.microsoft.com/v1.0',
        scopes: ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite']
      }
    },
    features: ['send', 'receive', 'templates']
  }
};

const getPlatformConfig = (platform) => {
  return PLATFORMS[platform.toUpperCase()] || null;
};

const getAllPlatforms = () => Object.keys(PLATFORMS);

module.exports = { PLATFORMS, getPlatformConfig, getAllPlatforms };
