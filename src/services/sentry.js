import * as Sentry from '@sentry/react';

/**
 * Sentry Frontend Error Tracking
 * Provides browser error monitoring and performance tracking
 */

let isInitialized = false;

/**
 * Initialize Sentry for the React frontend
 * Call this early in your application startup (e.g., in main.jsx)
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] No VITE_SENTRY_DSN configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Session replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.filter(
            (breadcrumb) => !breadcrumb.message?.includes('password')
          );
        }
        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'Network request failed',
      ],

      // Enable React-specific integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
        Sentry.reactRouterV6BrowserTracingIntegration(),
      ],
    });

    isInitialized = true;
    console.log('[Sentry] Frontend initialized successfully');
  } catch (error) {
    console.error('[Sentry] Frontend initialization failed:', error.message);
  }
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
 * Error Boundary component wrapper
 * Use this to wrap your app or sections
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for performance monitoring
 */
export const SentryProfiler = Sentry.withProfiler;

/**
 * Create a custom error boundary fallback
 */
export const createErrorBoundary = (fallbackComponent) => {
  return function ErrorBoundaryWrapper({ children }) {
    return (
      <Sentry.ErrorBoundary fallback={fallbackComponent}>
        {children}
      </Sentry.ErrorBoundary>
    );
  };
};

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setContext,
  setTag,
  SentryErrorBoundary,
  SentryProfiler,
  createErrorBoundary,
};
