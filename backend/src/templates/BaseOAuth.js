/**
 * ============================================================================
 * BASE OAUTH TEMPLATE
 * ============================================================================
 * Unified OAuth flow handler for any social media platform.
 *
 * Usage:
 *   const TwitterOAuth = require('./templates/BaseOAuth').create({
 *     platform: 'twitter',
 *     authUrl: 'https://twitter.com/i/oauth2/authorize',
 *     tokenUrl: 'https://api.twitter.com/2/oauth2/token',
 *     scopes: ['tweet.read', 'tweet.write', 'users.read'],
 *     clientId: process.env.TWITTER_CLIENT_ID,
 *     clientSecret: process.env.TWITTER_CLIENT_SECRET,
 *   });
 *
 *   // In routes
 *   router.get('/twitter/auth', TwitterOAuth.initiateAuth);
 *   router.get('/twitter/callback', TwitterOAuth.handleCallback);
 */

const crypto = require('crypto');
const axios = require('axios');

class BaseOAuth {
  /**
   * @param {Object} config - OAuth configuration
   * @param {string} config.platform - Platform identifier
   * @param {string} config.authUrl - Authorization URL
   * @param {string} config.tokenUrl - Token exchange URL
   * @param {string} config.userInfoUrl - User info endpoint (optional)
   * @param {string[]} config.scopes - Required scopes
   * @param {string} config.clientId - OAuth client ID
   * @param {string} config.clientSecret - OAuth client secret
   * @param {string} config.redirectUri - Callback URI
   * @param {string} config.authType - 'oauth2' or 'oauth1'
   * @param {boolean} config.usePKCE - Use PKCE for OAuth2
   * @param {Object} config.extraParams - Additional auth params
   */
  constructor(config) {
    this.config = {
      authType: 'oauth2',
      usePKCE: false,
      extraParams: {},
      ...config
    };

    this.validateConfig();

    // Bind methods to maintain context
    this.initiateAuth = this.initiateAuth.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
  }

  validateConfig() {
    const required = ['platform', 'authUrl', 'tokenUrl', 'clientId', 'clientSecret'];
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`OAuth config missing required field: ${field}`);
      }
    }
  }

  // ============================================================================
  // AUTHORIZATION FLOW
  // ============================================================================

  /**
   * Generate authorization URL and redirect user
   * Express middleware: router.get('/auth', oauth.initiateAuth)
   */
  initiateAuth(req, res) {
    try {
      const state = this.generateState();
      const codeVerifier = this.config.usePKCE ? this.generateCodeVerifier() : null;
      const codeChallenge = codeVerifier ? this.generateCodeChallenge(codeVerifier) : null;

      // Store state in session for verification
      req.session = req.session || {};
      req.session.oauthState = state;
      if (codeVerifier) {
        req.session.codeVerifier = codeVerifier;
      }

      const authUrl = this.buildAuthUrl({
        state,
        codeChallenge,
        redirectUri: this.getRedirectUri(req),
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error(`[${this.config.platform}] Auth initiation failed:`, error);
      res.redirect(`/oauth/error?platform=${this.config.platform}&error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Build the authorization URL with all parameters
   */
  buildAuthUrl({ state, codeChallenge, redirectUri }) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      ...this.config.extraParams,
    });

    if (this.config.scopes?.length > 0) {
      params.set('scope', this.config.scopes.join(' '));
    }

    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * Express middleware: router.get('/callback', oauth.handleCallback)
   */
  async handleCallback(req, res, next) {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        throw new Error(error_description || error);
      }

      // Verify state
      if (req.session?.oauthState && req.session.oauthState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens({
        code,
        redirectUri: this.getRedirectUri(req),
        codeVerifier: req.session?.codeVerifier,
      });

      // Fetch user info if endpoint configured
      let userInfo = null;
      if (this.config.userInfoUrl) {
        userInfo = await this.fetchUserInfo(tokens.access_token);
      }

      // Clean up session
      if (req.session) {
        delete req.session.oauthState;
        delete req.session.codeVerifier;
      }

      // Attach to request for downstream handlers
      req.oauthResult = {
        platform: this.config.platform,
        tokens,
        userInfo,
      };

      // Call next middleware or use custom handler
      if (this.config.onSuccess) {
        return this.config.onSuccess(req, res, req.oauthResult);
      }

      next();
    } catch (error) {
      console.error(`[${this.config.platform}] OAuth callback failed:`, error);

      if (this.config.onError) {
        return this.config.onError(req, res, error);
      }

      res.redirect(`/oauth/error?platform=${this.config.platform}&error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  async exchangeCodeForTokens({ code, redirectUri, codeVerifier }) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.config.clientId,
    });

    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    // Some providers require client secret in body, others in header
    if (!this.config.usePKCE) {
      params.set('client_secret', this.config.clientSecret);
    }

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add Basic auth header if required
    if (this.config.useBasicAuth) {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await axios.post(this.config.tokenUrl, params.toString(), { headers });

    return this.normalizeTokenResponse(response.data);
  }

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    if (!this.config.usePKCE) {
      params.set('client_secret', this.config.clientSecret);
    }

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.config.useBasicAuth) {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await axios.post(this.config.tokenUrl, params.toString(), { headers });

    return this.normalizeTokenResponse(response.data);
  }

  /**
   * Fetch user info from the platform
   */
  async fetchUserInfo(accessToken) {
    if (!this.config.userInfoUrl) {
      return null;
    }

    const response = await axios.get(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Allow custom user info transformation
    if (this.config.transformUserInfo) {
      return this.config.transformUserInfo(response.data);
    }

    return response.data;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Normalize token response to consistent format
   */
  normalizeTokenResponse(data) {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in,
      expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
      scope: data.scope,
      raw: data, // Keep original response
    };
  }

  /**
   * Generate cryptographic state parameter
   */
  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Get redirect URI (supports dynamic construction)
   */
  getRedirectUri(req) {
    if (this.config.redirectUri) {
      return this.config.redirectUri;
    }

    // Build from request
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https'
      ? 'https'
      : 'http';
    const host = req.headers.host;
    return `${protocol}://${host}/api/oauth/${this.config.platform}/callback`;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Encrypt token for storage
   */
  encryptToken(token) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) return token;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt stored token
   */
  decryptToken(encryptedToken) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || !encryptedToken.includes(':')) return encryptedToken;

    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ============================================================================
  // STATIC FACTORY
  // ============================================================================

  /**
   * Create an OAuth handler instance
   */
  static create(config) {
    return new BaseOAuth(config);
  }
}

// ============================================================================
// PLATFORM PRESETS
// ============================================================================

/**
 * Pre-configured OAuth settings for common platforms
 */
BaseOAuth.presets = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    usePKCE: true,
    useBasicAuth: true,
    transformUserInfo: (data) => ({
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      profileImageUrl: data.data.profile_image_url,
    }),
  },

  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me',
    scopes: ['user_profile', 'user_media'],
    extraParams: { response_type: 'code' },
    transformUserInfo: (data) => ({
      id: data.id,
      username: data.username,
    }),
  },

  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    transformUserInfo: (data) => ({
      id: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    }),
  },

  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
    extraParams: { access_type: 'offline', prompt: 'consent' },
    transformUserInfo: (data) => ({
      id: data.items?.[0]?.id,
      title: data.items?.[0]?.snippet?.title,
      thumbnailUrl: data.items?.[0]?.snippet?.thumbnails?.default?.url,
    }),
  },

  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    transformUserInfo: (data) => ({
      id: data.id,
      username: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      email: data.email,
    }),
  },
};

/**
 * Create OAuth handler from preset
 */
BaseOAuth.fromPreset = (platform, overrides = {}) => {
  const preset = BaseOAuth.presets[platform];
  if (!preset) {
    throw new Error(`No preset found for platform: ${platform}`);
  }

  return new BaseOAuth({
    platform,
    ...preset,
    ...overrides,
  });
};

module.exports = BaseOAuth;
