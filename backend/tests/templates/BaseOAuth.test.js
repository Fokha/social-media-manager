/**
 * BaseOAuth Template Tests
 */
const BaseOAuth = require('../../src/templates/BaseOAuth');
const crypto = require('crypto');

describe('BaseOAuth Template', () => {
  const testConfig = {
    platform: 'test',
    authUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    userInfoUrl: 'https://api.example.com/user',
    scopes: ['read', 'write'],
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback'
  };

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      const oauth = new BaseOAuth(testConfig);
      expect(oauth).toBeInstanceOf(BaseOAuth);
      expect(oauth.config.platform).toBe('test');
    });

    it('should throw error for missing required fields', () => {
      expect(() => new BaseOAuth({ platform: 'test' }))
        .toThrow('OAuth config missing required field');
    });

    it('should set default values', () => {
      const oauth = new BaseOAuth(testConfig);
      expect(oauth.config.authType).toBe('oauth2');
      expect(oauth.config.usePKCE).toBe(false);
      expect(oauth.config.extraParams).toEqual({});
    });
  });

  describe('Static Factory', () => {
    it('should create instance via static create method', () => {
      const oauth = BaseOAuth.create(testConfig);
      expect(oauth).toBeInstanceOf(BaseOAuth);
    });

    it('should create instance from preset', () => {
      const oauth = BaseOAuth.fromPreset('twitter', {
        clientId: 'my-client-id',
        clientSecret: 'my-client-secret'
      });

      expect(oauth.config.platform).toBe('twitter');
      expect(oauth.config.usePKCE).toBe(true);
      expect(oauth.config.clientId).toBe('my-client-id');
    });

    it('should throw error for unknown preset', () => {
      expect(() => BaseOAuth.fromPreset('unknown'))
        .toThrow('No preset found for platform: unknown');
    });
  });

  describe('Platform Presets', () => {
    const platforms = ['twitter', 'instagram', 'linkedin', 'youtube', 'github'];

    platforms.forEach(platform => {
      it(`should have preset for ${platform}`, () => {
        expect(BaseOAuth.presets[platform]).toBeDefined();
        expect(BaseOAuth.presets[platform].authUrl).toBeDefined();
        expect(BaseOAuth.presets[platform].tokenUrl).toBeDefined();
      });
    });
  });

  describe('buildAuthUrl', () => {
    it('should build correct authorization URL', () => {
      const oauth = new BaseOAuth(testConfig);
      const url = oauth.buildAuthUrl({
        state: 'test-state',
        redirectUri: 'http://localhost:3000/callback'
      });

      expect(url).toContain('https://auth.example.com/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('state=test-state');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=read+write');
    });

    it('should include PKCE code challenge when configured', () => {
      const oauth = new BaseOAuth({ ...testConfig, usePKCE: true });
      const url = oauth.buildAuthUrl({
        state: 'test-state',
        codeChallenge: 'test-challenge',
        redirectUri: 'http://localhost:3000/callback'
      });

      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('should include extra params', () => {
      const oauth = new BaseOAuth({
        ...testConfig,
        extraParams: { access_type: 'offline', prompt: 'consent' }
      });
      const url = oauth.buildAuthUrl({
        state: 'test-state',
        redirectUri: 'http://localhost:3000/callback'
      });

      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });
  });

  describe('PKCE Methods', () => {
    let oauth;

    beforeEach(() => {
      oauth = new BaseOAuth({ ...testConfig, usePKCE: true });
    });

    it('should generate cryptographic state', () => {
      const state = oauth.generateState();
      expect(state).toHaveLength(64); // 32 bytes hex
      expect(/^[a-f0-9]+$/.test(state)).toBe(true);
    });

    it('should generate code verifier', () => {
      const verifier = oauth.generateCodeVerifier();
      expect(verifier.length).toBeGreaterThan(40);
    });

    it('should generate code challenge from verifier', () => {
      const verifier = oauth.generateCodeVerifier();
      const challenge = oauth.generateCodeChallenge(verifier);

      // Challenge should be different from verifier
      expect(challenge).not.toBe(verifier);
      // Should be base64url encoded
      expect(/^[A-Za-z0-9_-]+$/.test(challenge)).toBe(true);
    });

    it('should generate consistent challenge for same verifier', () => {
      const verifier = 'test-verifier-string';
      const challenge1 = oauth.generateCodeChallenge(verifier);
      const challenge2 = oauth.generateCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
    });
  });

  describe('Token Response Normalization', () => {
    let oauth;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
    });

    it('should normalize token response', () => {
      const rawResponse = {
        access_token: 'test-access',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        scope: 'read write'
      };

      const normalized = oauth.normalizeTokenResponse(rawResponse);

      expect(normalized.access_token).toBe('test-access');
      expect(normalized.refresh_token).toBe('test-refresh');
      expect(normalized.token_type).toBe('Bearer');
      expect(normalized.expires_in).toBe(3600);
      expect(normalized.expires_at).toBeDefined();
      expect(normalized.raw).toEqual(rawResponse);
    });

    it('should calculate expires_at correctly', () => {
      const before = new Date();
      const normalized = oauth.normalizeTokenResponse({
        access_token: 'test',
        expires_in: 3600
      });
      const after = new Date();

      const expiresAt = new Date(normalized.expires_at);
      const expectedMin = new Date(before.getTime() + 3600 * 1000);
      const expectedMax = new Date(after.getTime() + 3600 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it('should handle missing expires_in', () => {
      const normalized = oauth.normalizeTokenResponse({
        access_token: 'test'
      });

      expect(normalized.expires_at).toBeNull();
    });
  });

  describe('Token Expiration Check', () => {
    let oauth;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
    });

    it('should detect expired token', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      expect(oauth.isTokenExpired(pastDate)).toBe(true);
    });

    it('should detect valid token', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      expect(oauth.isTokenExpired(futureDate)).toBe(false);
    });

    it('should return false for null/undefined expires_at', () => {
      expect(oauth.isTokenExpired(null)).toBe(false);
      expect(oauth.isTokenExpired(undefined)).toBe(false);
    });
  });

  describe('Token Encryption', () => {
    let oauth;
    const originalEnv = process.env.ENCRYPTION_KEY;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
      process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    });

    afterEach(() => {
      process.env.ENCRYPTION_KEY = originalEnv;
    });

    it('should encrypt and decrypt token', () => {
      const originalToken = 'super-secret-token-12345';

      const encrypted = oauth.encryptToken(originalToken);
      expect(encrypted).not.toBe(originalToken);
      expect(encrypted).toContain(':');

      const decrypted = oauth.decryptToken(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('should return token as-is if no encryption key', () => {
      delete process.env.ENCRYPTION_KEY;

      const token = 'plain-token';
      const encrypted = oauth.encryptToken(token);
      expect(encrypted).toBe(token);
    });

    it('should return token as-is if not in encrypted format', () => {
      const token = 'not-encrypted-token';
      const decrypted = oauth.decryptToken(token);
      expect(decrypted).toBe(token);
    });

    it('should produce different ciphertext for same token (random IV)', () => {
      const token = 'same-token';

      const encrypted1 = oauth.encryptToken(token);
      const encrypted2 = oauth.encryptToken(token);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      expect(oauth.decryptToken(encrypted1)).toBe(token);
      expect(oauth.decryptToken(encrypted2)).toBe(token);
    });
  });

  describe('Redirect URI', () => {
    let oauth;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
    });

    it('should use configured redirectUri', () => {
      const req = { secure: false, headers: { host: 'localhost:3000' } };
      const uri = oauth.getRedirectUri(req);
      expect(uri).toBe('http://localhost:3000/callback');
    });

    it('should build URI from request if not configured', () => {
      const oauthNoUri = new BaseOAuth({
        ...testConfig,
        redirectUri: undefined
      });

      const req = {
        secure: true,
        headers: { host: 'api.example.com' }
      };

      const uri = oauthNoUri.getRedirectUri(req);
      expect(uri).toBe('https://api.example.com/api/oauth/test/callback');
    });

    it('should detect HTTPS from x-forwarded-proto header', () => {
      const oauthNoUri = new BaseOAuth({
        ...testConfig,
        redirectUri: undefined
      });

      const req = {
        secure: false,
        headers: {
          host: 'api.example.com',
          'x-forwarded-proto': 'https'
        }
      };

      const uri = oauthNoUri.getRedirectUri(req);
      expect(uri).toContain('https://');
    });
  });

  describe('initiateAuth', () => {
    let oauth;
    let mockReq;
    let mockRes;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
      mockReq = { session: {} };
      mockRes = {
        redirect: jest.fn()
      };
    });

    it('should redirect to auth URL', () => {
      oauth.initiateAuth(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('https://auth.example.com/authorize');
    });

    it('should store state in session', () => {
      oauth.initiateAuth(mockReq, mockRes);

      expect(mockReq.session.oauthState).toBeDefined();
      expect(mockReq.session.oauthState).toHaveLength(64);
    });

    it('should store code verifier when PKCE enabled', () => {
      const pkceOauth = new BaseOAuth({ ...testConfig, usePKCE: true });
      pkceOauth.initiateAuth(mockReq, mockRes);

      expect(mockReq.session.codeVerifier).toBeDefined();
    });

    it('should redirect to error page on failure', () => {
      const badOauth = new BaseOAuth(testConfig);
      badOauth.buildAuthUrl = () => { throw new Error('Build failed'); };

      badOauth.initiateAuth(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('/oauth/error');
      expect(redirectUrl).toContain('platform=test');
    });
  });

  describe('handleCallback', () => {
    let oauth;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      oauth = new BaseOAuth(testConfig);
      mockReq = {
        query: {},
        session: {}
      };
      mockRes = {
        redirect: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should handle OAuth error from provider', async () => {
      mockReq.query = {
        error: 'access_denied',
        error_description: 'User denied access'
      };

      await oauth.handleCallback(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('/oauth/error');
      expect(redirectUrl).toContain('User+denied+access');
    });

    it('should reject invalid state', async () => {
      mockReq.query = { code: 'test-code', state: 'invalid-state' };
      mockReq.session = { oauthState: 'correct-state' };

      await oauth.handleCallback(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalled();
      const redirectUrl = mockRes.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('CSRF');
    });

    it('should call custom onError handler', async () => {
      const onError = jest.fn();
      const oauthWithHandler = new BaseOAuth({ ...testConfig, onError });

      mockReq.query = { error: 'test_error' };

      await oauthWithHandler.handleCallback(mockReq, mockRes, mockNext);

      expect(onError).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Preset Transformations', () => {
    it('should transform Twitter user info correctly', () => {
      const transform = BaseOAuth.presets.twitter.transformUserInfo;
      const result = transform({
        data: {
          id: '12345',
          username: 'testuser',
          name: 'Test User',
          profile_image_url: 'https://example.com/pic.jpg'
        }
      });

      expect(result.id).toBe('12345');
      expect(result.username).toBe('testuser');
      expect(result.name).toBe('Test User');
      expect(result.profileImageUrl).toBe('https://example.com/pic.jpg');
    });

    it('should transform GitHub user info correctly', () => {
      const transform = BaseOAuth.presets.github.transformUserInfo;
      const result = transform({
        id: 67890,
        login: 'octocat',
        name: 'Octo Cat',
        avatar_url: 'https://github.com/avatar.jpg',
        email: 'octo@github.com'
      });

      expect(result.id).toBe(67890);
      expect(result.username).toBe('octocat');
      expect(result.name).toBe('Octo Cat');
      expect(result.avatarUrl).toBe('https://github.com/avatar.jpg');
      expect(result.email).toBe('octo@github.com');
    });

    it('should transform LinkedIn user info correctly', () => {
      const transform = BaseOAuth.presets.linkedin.transformUserInfo;
      const result = transform({
        sub: 'abc123',
        name: 'Professional User',
        email: 'pro@linkedin.com',
        picture: 'https://linkedin.com/pic.jpg'
      });

      expect(result.id).toBe('abc123');
      expect(result.name).toBe('Professional User');
      expect(result.email).toBe('pro@linkedin.com');
      expect(result.picture).toBe('https://linkedin.com/pic.jpg');
    });

    it('should transform YouTube user info correctly', () => {
      const transform = BaseOAuth.presets.youtube.transformUserInfo;
      const result = transform({
        items: [{
          id: 'UC12345',
          snippet: {
            title: 'My Channel',
            thumbnails: {
              default: { url: 'https://youtube.com/thumb.jpg' }
            }
          }
        }]
      });

      expect(result.id).toBe('UC12345');
      expect(result.title).toBe('My Channel');
      expect(result.thumbnailUrl).toBe('https://youtube.com/thumb.jpg');
    });
  });
});
