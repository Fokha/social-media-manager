/**
 * OAuth Routes - Using BaseOAuth template for unified OAuth flows
 */
const express = require('express');
const router = express.Router();
const BaseOAuth = require('../templates/BaseOAuth');
const { authenticate } = require('../middleware/auth');
const AccountService = require('../services/AccountService');
const logger = require('../utils/logger');

// =============================================================================
// OAUTH HANDLERS CONFIGURATION
// =============================================================================

const createOAuthHandler = (platform, config) => {
  return BaseOAuth.create({
    platform,
    ...BaseOAuth.presets[platform],
    ...config,
    clientId: process.env[`${platform.toUpperCase()}_CLIENT_ID`] || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env[`${platform.toUpperCase()}_REDIRECT_URI`] ||
      `${process.env.API_URL || 'http://localhost:3000'}/api/oauth/${platform}/callback`,
  });
};

// Initialize OAuth handlers for each platform
const oauthHandlers = {};

const initializeHandler = (platform) => {
  try {
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`] ||
                     (platform === 'youtube' ? process.env.GOOGLE_CLIENT_ID : null) ||
                     (platform === 'instagram' ? process.env.FACEBOOK_APP_ID : null);

    if (clientId) {
      oauthHandlers[platform] = createOAuthHandler(platform, {
        clientId,
        clientSecret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] ||
                      (platform === 'youtube' ? process.env.GOOGLE_CLIENT_SECRET : null) ||
                      (platform === 'instagram' ? process.env.FACEBOOK_APP_SECRET : null),
      });
      logger.info(`OAuth handler initialized for ${platform}`);
    }
  } catch (e) {
    logger.warn(`OAuth handler not configured for ${platform}: ${e.message}`);
  }
};

// Initialize available platforms
['twitter', 'instagram', 'linkedin', 'youtube', 'github'].forEach(initializeHandler);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateState = (userId) => {
  return Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now()
  })).toString('base64');
};

const parseState = (state) => {
  try {
    return JSON.parse(Buffer.from(state, 'base64').toString());
  } catch (e) {
    throw new Error('Invalid state parameter');
  }
};

const handleOAuthSuccess = async (req, res, platform, tokens, userInfo) => {
  try {
    const { userId } = parseState(req.query.state);

    // Connect account using AccountService
    const { account, created } = await AccountService.connectAccount(userId, {
      platform,
      platformUserId: userInfo.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_at ? new Date(tokens.expires_at) : null,
      platformUsername: userInfo.username || userInfo.email,
      platformDisplayName: userInfo.name || userInfo.username,
      profilePicture: userInfo.profileImageUrl || userInfo.picture,
      metadata: userInfo.raw
    });

    logger.info(`${platform} account ${created ? 'connected' : 'updated'} for user ${userId}`);

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?connected=${platform}`);
  } catch (error) {
    logger.error(`OAuth success handler failed for ${platform}:`, error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

// GET /api/oauth/:platform/url - Get OAuth URL (for popup flows)
router.get('/:platform/url', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.params;
    const handler = oauthHandlers[platform];

    if (!handler) {
      return res.status(503).json({
        success: false,
        error: `OAuth not configured for ${platform}`
      });
    }

    const state = generateState(req.user.id);
    const authUrl = handler.buildAuthUrl({
      state,
      redirectUri: handler.getRedirectUri(req)
    });

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/oauth/:platform/connect - Redirect to OAuth provider
router.get('/:platform/connect', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.params;
    const handler = oauthHandlers[platform];

    if (!handler) {
      return res.status(503).json({
        success: false,
        error: `OAuth not configured for ${platform}`
      });
    }

    // Check subscription limits
    const subscription = req.user.subscription;
    if (subscription?.canAddSocialAccount && !subscription.canAddSocialAccount()) {
      return res.status(403).json({
        success: false,
        error: 'Social account limit reached. Please upgrade your plan.'
      });
    }

    const state = generateState(req.user.id);
    const authUrl = handler.buildAuthUrl({
      state,
      redirectUri: handler.getRedirectUri(req)
    });

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// PLATFORM-SPECIFIC CALLBACKS
// =============================================================================

// Twitter callback
router.get('/twitter/callback', async (req, res) => {
  try {
    const handler = oauthHandlers.twitter;
    if (!handler) throw new Error('Twitter OAuth not configured');

    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(oauthError);

    const tokens = await handler.exchangeCodeForTokens({
      code,
      redirectUri: handler.getRedirectUri(req),
      codeVerifier: 'challenge' // TODO: Implement proper PKCE
    });

    const userInfo = await handler.fetchUserInfo(tokens.access_token);

    await handleOAuthSuccess(req, res, 'twitter', tokens, userInfo);
  } catch (error) {
    logger.error('Twitter OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed`);
  }
});

// YouTube/Google callback
router.get('/youtube/callback', async (req, res) => {
  try {
    const handler = oauthHandlers.youtube;
    if (!handler) throw new Error('YouTube OAuth not configured');

    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(oauthError);

    const tokens = await handler.exchangeCodeForTokens({
      code,
      redirectUri: handler.getRedirectUri(req)
    });

    const userInfo = await handler.fetchUserInfo(tokens.access_token);

    await handleOAuthSuccess(req, res, 'youtube', tokens, userInfo);
  } catch (error) {
    logger.error('YouTube OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed`);
  }
});

// Google callback (alias for YouTube)
router.get('/google/callback', async (req, res) => {
  req.url = '/youtube/callback';
  router.handle(req, res);
});

// LinkedIn callback
router.get('/linkedin/callback', async (req, res) => {
  try {
    const handler = oauthHandlers.linkedin;
    if (!handler) throw new Error('LinkedIn OAuth not configured');

    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(oauthError);

    const tokens = await handler.exchangeCodeForTokens({
      code,
      redirectUri: handler.getRedirectUri(req)
    });

    const userInfo = await handler.fetchUserInfo(tokens.access_token);

    await handleOAuthSuccess(req, res, 'linkedin', tokens, userInfo);
  } catch (error) {
    logger.error('LinkedIn OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed`);
  }
});

// GitHub callback
router.get('/github/callback', async (req, res) => {
  try {
    const handler = oauthHandlers.github;
    if (!handler) throw new Error('GitHub OAuth not configured');

    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(oauthError);

    const tokens = await handler.exchangeCodeForTokens({
      code,
      redirectUri: handler.getRedirectUri(req)
    });

    const userInfo = await handler.fetchUserInfo(tokens.access_token);

    await handleOAuthSuccess(req, res, 'github', tokens, userInfo);
  } catch (error) {
    logger.error('GitHub OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed`);
  }
});

// Instagram/Facebook callback (Instagram uses Facebook Graph API)
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(oauthError);

    const { userId } = parseState(state);
    const axios = require('axios');

    // Exchange code for token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI ||
          `${process.env.API_URL || 'http://localhost:3000'}/api/oauth/instagram/callback`,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get pages with Instagram accounts
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token }
    });

    const pages = pagesResponse.data.data || [];

    for (const page of pages) {
      // Get Instagram Business Account
      const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
        params: {
          fields: 'instagram_business_account{id,username,name,profile_picture_url}',
          access_token: page.access_token
        }
      });

      if (igResponse.data.instagram_business_account) {
        const igAccount = igResponse.data.instagram_business_account;

        await AccountService.connectAccount(userId, {
          platform: 'instagram',
          platformUserId: igAccount.id,
          accessToken: page.access_token,
          platformUsername: igAccount.username,
          platformDisplayName: igAccount.name,
          profilePicture: igAccount.profile_picture_url,
          metadata: { pageId: page.id }
        });
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?connected=instagram`);
  } catch (error) {
    logger.error('Instagram OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/dashboard/accounts?error=oauth_failed`);
  }
});

// Facebook callback (alias for Instagram)
router.get('/facebook/callback', async (req, res) => {
  req.url = '/instagram/callback';
  router.handle(req, res);
});

// =============================================================================
// UTILITY ROUTES
// =============================================================================

// GET /api/oauth/supported - List supported platforms
router.get('/supported', (req, res) => {
  const supported = Object.keys(oauthHandlers).map(platform => ({
    platform,
    configured: true,
    ...BaseOAuth.presets[platform] ? {
      name: platform.charAt(0).toUpperCase() + platform.slice(1)
    } : {}
  }));

  res.json({
    success: true,
    data: { platforms: supported }
  });
});

module.exports = router;
