/**
 * Platform Services Index
 * Exports all platform service classes
 */

const BasePlatform = require('./BasePlatform');
const InstagramService = require('./instagram');
const TwitterService = require('./twitter');
const LinkedInService = require('./linkedin');
const YouTubeService = require('./youtube');
const WhatsAppService = require('./whatsapp');
const TelegramService = require('./telegram');
const GitHubService = require('./github');

const PLATFORM_SERVICES = {
  instagram: InstagramService,
  twitter: TwitterService,
  linkedin: LinkedInService,
  youtube: YouTubeService,
  whatsapp: WhatsAppService,
  telegram: TelegramService,
  github: GitHubService
};

/**
 * Get the appropriate service for a platform
 */
const getPlatformService = (platform, account) => {
  const ServiceClass = PLATFORM_SERVICES[platform.toLowerCase()];

  if (!ServiceClass) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return new ServiceClass(account);
};

/**
 * Check if a platform is supported
 */
const isPlatformSupported = (platform) => {
  return platform.toLowerCase() in PLATFORM_SERVICES;
};

/**
 * Get list of supported platforms
 */
const getSupportedPlatforms = () => {
  return Object.keys(PLATFORM_SERVICES);
};

module.exports = {
  BasePlatform,
  InstagramService,
  TwitterService,
  LinkedInService,
  YouTubeService,
  WhatsAppService,
  TelegramService,
  GitHubService,
  getPlatformService,
  isPlatformSupported,
  getSupportedPlatforms
};
