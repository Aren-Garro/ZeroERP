import * as Sentry from '@sentry/node';

/**
 * Sentry Error Tracking Service
 * Provides error monitoring and performance tracking
 */

let isInitialized = false;

/**
 * Initialize Sentry for the backend
 * Call this early in your application startup
 */
export const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] No SENTRY_DSN configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Profile sampling (if performance monitoring is enabled)
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['x-api-key'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive body data
        if (event.request?.data) {
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
          sensitiveFields.forEach(field => {
            if (event.request.data[field]) {
              event.request.data[field] = '[REDACTED]';
            }
          });
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Ignore network errors that are expected
        'Network request failed',
        'Failed to fetch',
        // Ignore aborted requests
        'AbortError',
      ],

      // Additional integrations
      integrations: [
        // Enable HTTP instrumentation
        Sentry.httpIntegration(),
        // Enable Express instrumentation
        Sentry.expressIntegration(),
      ],
    });

    // Add Sentry middleware to Express app
    if (app) {
      // Request handler must be first
      app.use(Sentry.expressRequestHandler());
      // TracingHandler creates a trace for every incoming request
      app.use(Sentry.expressTracingHandler());
    }

    isInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error.message);
  }
};

/**
 * Add Sentry error handler middleware
 * Must be added after all routes and before other error handlers
 */
export const sentryErrorHandler = () => {
  if (!isInitialized) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.expressErrorHandler();
};

/**
 * Capture an exception manually
 */
export const captureException = (error, context = {}) => {
  if (!isInitialized) {
    console.error('[Sentry] Not initialized. Error:', error.message);
    return null;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message/event
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!isInitialized) {
    console.log(`[Sentry] Not initialized. Message (${level}):`, message);
    return null;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 */
export const setUser = (user) => {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (!isInitialized) return;
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    category: breadcrumb.category || 'custom',
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
};

/**
 * Set extra context data
 */
export const setContext = (name, data) => {
  if (!isInitialized) return;
  Sentry.setContext(name, data);
};

/**
 * Set a tag for filtering
 */
export const setTag = (key, value) => {
  if (!isInitialized) return;
  Sentry.setTag(key, value);
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name, op = 'task') => {
  if (!isInitialized) return null;

  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
};

/**
 * Wrap an async function with error capturing
 */
export const wrapAsync = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, { args });
      throw error;
    }
  };
};

/**
 * Express error handling middleware
 */
export const errorMiddleware = (err, req, res, next) => {
  // Capture the error with request context
  captureException(err, {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
  });

  // Pass to next error handler
  next(err);
};

/**
 * Health check for Sentry
 */
export const healthCheck = () => ({
  status: isInitialized ? 'healthy' : 'disabled',
  dsn: process.env.SENTRY_DSN ? 'configured' : 'not_configured',
});

/**
 * Flush pending events (useful before process exit)
 */
export const flush = async (timeout = 2000) => {
  if (!isInitialized) return;
  await Sentry.flush(timeout);
};

export default {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setContext,
  setTag,
  startTransaction,
  wrapAsync,
  errorMiddleware,
  healthCheck,
  flush,
};
