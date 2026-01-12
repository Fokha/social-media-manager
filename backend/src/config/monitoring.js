const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('../utils/logger');

/**
 * Initialize monitoring services
 */
const initMonitoring = () => {
  // Initialize Sentry if DSN is provided
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        // Enable profiling
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      // Set sampling rate for profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Capture unhandled promise rejections
      autoSessionTracking: true,
      // Filter sensitive data
      beforeSend(event) {
        // Don't send events in demo mode
        if (process.env.DEMO_MODE === 'true') {
          return null;
        }
        // Remove sensitive data
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
    logger.info('Sentry error monitoring initialized');
  } else {
    logger.warn('SENTRY_DSN not configured - error monitoring disabled');
  }
};

/**
 * Capture exception and log it
 */
const captureException = (error, context = {}) => {
  logger.error('Exception captured:', error.message, context);

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context
    });
  }
};

/**
 * Capture message for tracking
 */
const captureMessage = (message, level = 'info', context = {}) => {
  logger[level](message, context);

  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }
};

/**
 * Set user context for error tracking
 */
const setUserContext = (user) => {
  if (process.env.SENTRY_DSN && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.email
    });
  }
};

/**
 * Clear user context (on logout)
 */
const clearUserContext = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

/**
 * Express error handler for Sentry
 */
const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Express request handler for Sentry
 */
const sentryRequestHandler = Sentry.Handlers.requestHandler();

module.exports = {
  initMonitoring,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  sentryErrorHandler,
  sentryRequestHandler,
  Sentry
};
