const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { SocialAccount, Subscription } = require('../models');
const { PLATFORMS } = require('../config/platforms');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Helper to build OAuth URL
const buildOAuthUrl = (platform, state) => {
  const config = PLATFORMS[platform.toUpperCase()];
  if (!config || !config.authUrl) {
    throw new AppError(`OAuth not supported for ${platform}`, 400);
  }

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`] ||
                   process.env.GOOGLE_CLIENT_ID || // For YouTube
                   process.env.FACEBOOK_APP_ID;    // For Instagram

  const redirectUri = process.env[`${platform.toUpperCase()}_REDIRECT_URI`] ||
                      `${process.env.API_URL}/api/oauth/${platform}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${config.authUrl}?${params.toString()}`;
};

// GET /api/oauth/:platform/url - Get OAuth URL (for frontend compatibility)
router.get('/:platform/url', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.params;

    // Demo mode: simulate successful connection by adding a new demo account
    if (req.user.isDemo) {
      const demoAccounts = {
        twitter: {
          id: `demo-twitter-${Date.now()}`,
          platform: 'twitter',
          platformUsername: '@new_twitter_account',
          platformDisplayName: 'New Twitter Account',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        instagram: {
          id: `demo-instagram-${Date.now()}`,
          platform: 'instagram',
          platformUsername: 'new.instagram',
          platformDisplayName: 'New Instagram Account',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        linkedin: {
          id: `demo-linkedin-${Date.now()}`,
          platform: 'linkedin',
          platformUsername: 'New LinkedIn Profile',
          platformDisplayName: 'New LinkedIn Profile',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        youtube: {
          id: `demo-youtube-${Date.now()}`,
          platform: 'youtube',
          platformUsername: '@new_youtube_channel',
          platformDisplayName: 'New YouTube Channel',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        github: {
          id: `demo-github-${Date.now()}`,
          platform: 'github',
          platformUsername: 'new-github-user',
          platformDisplayName: 'New GitHub User',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        whatsapp: {
          id: `demo-whatsapp-${Date.now()}`,
          platform: 'whatsapp',
          platformUsername: '+1 555-123-4567',
          platformDisplayName: 'Business WhatsApp',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        telegram: {
          id: `demo-telegram-${Date.now()}`,
          platform: 'telegram',
          platformUsername: '@new_telegram_channel',
          platformDisplayName: 'New Telegram Channel',
          profilePicture: null,
          isActive: true,
          lastSyncAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      };

      return res.json({
        success: true,
        message: `Demo account connected for ${platform}`,
        data: {
          account: demoAccounts[platform] || demoAccounts.twitter,
          isDemoConnection: true
        }
      });
    }

    // Generate state token with user ID
    const state = Buffer.from(JSON.stringify({
      userId: req.user.id,
      timestamp: Date.now()
    })).toString('base64');

    const authUrl = buildOAuthUrl(platform, state);

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/oauth/:platform/connect
router.get('/:platform/connect', authenticate, async (req, res, next) => {
  try {
    const { platform } = req.params;

    // Demo mode: same as /url endpoint
    if (req.user.isDemo) {
      return res.json({
        success: true,
        message: `Demo mode - ${platform} account connected`,
        data: { isDemoConnection: true }
      });
    }

    // Check subscription limits
    const subscription = req.user.subscription;
    if (subscription && !subscription.canAddSocialAccount()) {
      throw new AppError('Social account limit reached. Please upgrade your plan.', 403);
    }

    // Generate state token with user ID
    const state = Buffer.from(JSON.stringify({
      userId: req.user.id,
      timestamp: Date.now()
    })).toString('base64');

    const authUrl = buildOAuthUrl(platform, state);

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/oauth/google/callback (YouTube & Gmail)
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      throw new AppError(`OAuth error: ${oauthError}`, 400);
    }

    // Decode state
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // Determine if YouTube or Gmail based on scopes
    const platform = 'youtube'; // Or detect from granted scopes

    // Save or update social account
    const [account, created] = await SocialAccount.findOrCreate({
      where: {
        userId,
        platform,
        platformUserId: userInfo.data.id
      },
      defaults: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        platformUsername: userInfo.data.email,
        platformDisplayName: userInfo.data.name,
        profilePicture: userInfo.data.picture
      }
    });

    if (!created) {
      await account.update({
        accessToken: access_token,
        ...(refresh_token && { refreshToken: refresh_token }),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000)
      });
    } else {
      // Update subscription usage
      await Subscription.increment('usage.socialAccounts', {
        by: 1,
        where: { userId }
      });
    }

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?connected=${platform}`);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=oauth_failed`);
  }
});

// GET /api/oauth/facebook/callback (Instagram)
router.get('/facebook/callback', async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      throw new AppError(`OAuth error: ${oauthError}`, 400);
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get pages with Instagram accounts
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token }
    });

    const pages = pagesResponse.data.data;

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

        await SocialAccount.findOrCreate({
          where: {
            userId,
            platform: 'instagram',
            platformUserId: igAccount.id
          },
          defaults: {
            accessToken: page.access_token,
            platformUsername: igAccount.username,
            platformDisplayName: igAccount.name,
            profilePicture: igAccount.profile_picture_url,
            metadata: { pageId: page.id }
          }
        });
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?connected=instagram`);
  } catch (error) {
    logger.error('Facebook/Instagram OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=oauth_failed`);
  }
});

// GET /api/oauth/twitter/callback
router.get('/twitter/callback', async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      throw new AppError(`OAuth error: ${oauthError}`, 400);
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token (Twitter uses PKCE)
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_REDIRECT_URI,
        code_verifier: 'challenge' // Store and retrieve proper code_verifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { 'user.fields': 'profile_image_url,name,username' }
    });

    const twitterUser = userResponse.data.data;

    await SocialAccount.findOrCreate({
      where: {
        userId,
        platform: 'twitter',
        platformUserId: twitterUser.id
      },
      defaults: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        platformUsername: twitterUser.username,
        platformDisplayName: twitterUser.name,
        profilePicture: twitterUser.profile_image_url
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?connected=twitter`);
  } catch (error) {
    logger.error('Twitter OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=oauth_failed`);
  }
});

// GET /api/oauth/linkedin/callback
router.get('/linkedin/callback', async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      throw new AppError(`OAuth error: ${oauthError}`, 400);
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const profile = profileResponse.data;

    await SocialAccount.findOrCreate({
      where: {
        userId,
        platform: 'linkedin',
        platformUserId: profile.id
      },
      defaults: {
        accessToken: access_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        platformDisplayName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        metadata: profile
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?connected=linkedin`);
  } catch (error) {
    logger.error('LinkedIn OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=oauth_failed`);
  }
});

// GET /api/oauth/github/callback
router.get('/github/callback', async (req, res, next) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      throw new AppError(`OAuth error: ${oauthError}`, 400);
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const ghUser = userResponse.data;

    await SocialAccount.findOrCreate({
      where: {
        userId,
        platform: 'github',
        platformUserId: String(ghUser.id)
      },
      defaults: {
        accessToken: access_token,
        platformUsername: ghUser.login,
        platformDisplayName: ghUser.name || ghUser.login,
        profilePicture: ghUser.avatar_url,
        metadata: {
          bio: ghUser.bio,
          publicRepos: ghUser.public_repos,
          followers: ghUser.followers
        }
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?connected=github`);
  } catch (error) {
    logger.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts?error=oauth_failed`);
  }
});

module.exports = router;
