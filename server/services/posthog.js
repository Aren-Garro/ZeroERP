import { PostHog } from 'posthog-node';

/**
 * PostHog Product Analytics Service
 * Provides event tracking, feature flags, and user analytics
 */

let posthogClient = null;
let isInitialized = false;

/**
 * Initialize PostHog client
 */
export const initPostHog = () => {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog] No POSTHOG_API_KEY configured. Analytics disabled.');
    return null;
  }

  try {
    posthogClient = new PostHog(apiKey, {
      host,
      // Batch events for better performance
      flushAt: 20,
      flushInterval: 10000, // 10 seconds
      // Disable in test environment
      disabled: process.env.NODE_ENV === 'test',
    });

    isInitialized = true;
    console.log('[PostHog] Initialized successfully');
    return posthogClient;
  } catch (error) {
    console.error('[PostHog] Initialization failed:', error.message);
    return null;
  }
};

/**
 * Capture an event
 */
export const capture = (distinctId, event, properties = {}) => {
  if (!isInitialized || !posthogClient) {
    return;
  }

  posthogClient.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $lib: 'zeroerp-backend',
      environment: process.env.NODE_ENV || 'development',
    },
  });
};

/**
 * Identify a user with properties
 */
export const identify = (distinctId, properties = {}) => {
  if (!isInitialized || !posthogClient) {
    return;
  }

  posthogClient.identify({
    distinctId,
    properties,
  });
};

/**
 * Create an alias for a user (link anonymous to identified)
 */
export const alias = (distinctId, alias) => {
  if (!isInitialized || !posthogClient) {
    return;
  }

  posthogClient.alias({
    distinctId,
    alias,
  });
};

/**
 * Set group properties (for company/organization analytics)
 */
export const groupIdentify = (groupType, groupKey, properties = {}) => {
  if (!isInitialized || !posthogClient) {
    return;
  }

  posthogClient.groupIdentify({
    groupType,
    groupKey,
    properties,
  });
};

/**
 * Check if a feature flag is enabled
 */
export const isFeatureEnabled = async (distinctId, flagKey, defaultValue = false) => {
  if (!isInitialized || !posthogClient) {
    return defaultValue;
  }

  try {
    const isEnabled = await posthogClient.isFeatureEnabled(flagKey, distinctId);
    return isEnabled ?? defaultValue;
  } catch (error) {
    console.error(`[PostHog] Feature flag check failed for ${flagKey}:`, error.message);
    return defaultValue;
  }
};

/**
 * Get feature flag value (for multivariate flags)
 */
export const getFeatureFlagValue = async (distinctId, flagKey, defaultValue = null) => {
  if (!isInitialized || !posthogClient) {
    return defaultValue;
  }

  try {
    const value = await posthogClient.getFeatureFlag(flagKey, distinctId);
    return value ?? defaultValue;
  } catch (error) {
    console.error(`[PostHog] Feature flag value fetch failed for ${flagKey}:`, error.message);
    return defaultValue;
  }
};

/**
 * Get all feature flags for a user
 */
export const getAllFeatureFlags = async (distinctId) => {
  if (!isInitialized || !posthogClient) {
    return {};
  }

  try {
    return await posthogClient.getAllFlags(distinctId);
  } catch (error) {
    console.error('[PostHog] Get all flags failed:', error.message);
    return {};
  }
};

/**
 * ============================================================================
 * PRE-DEFINED EVENTS FOR ERP
 * ============================================================================
 */

export const events = {
  // Order events
  orderCreated: (userId, order) => capture(userId, 'Order Created', {
    order_id: order.id,
    total: order.total,
    item_count: order.items?.length || 0,
  }),

  orderShipped: (userId, order) => capture(userId, 'Order Shipped', {
    order_id: order.id,
  }),

  orderCancelled: (userId, order) => capture(userId, 'Order Cancelled', {
    order_id: order.id,
    reason: order.cancellationReason,
  }),

  // Inventory events
  inventoryLow: (userId, item) => capture(userId, 'Inventory Low Alert', {
    sku: item.sku,
    product_name: item.name,
    current_stock: item.currentStock,
    safety_stock: item.safetyStock,
  }),

  inventoryUpdated: (userId, item) => capture(userId, 'Inventory Updated', {
    sku: item.sku,
    previous_stock: item.previousStock,
    new_stock: item.currentStock,
  }),

  // Purchase Order events
  poCreated: (userId, po) => capture(userId, 'Purchase Order Created', {
    po_id: po.id,
    supplier: po.supplier,
    total: po.total,
  }),

  poReceived: (userId, po) => capture(userId, 'Purchase Order Received', {
    po_id: po.id,
    items_received: po.itemsReceived,
  }),

  // User events
  userSignedUp: (userId, properties) => capture(userId, 'User Signed Up', properties),
  userLoggedIn: (userId) => capture(userId, 'User Logged In'),
  userLoggedOut: (userId) => capture(userId, 'User Logged Out'),

  // Integration events
  integrationConnected: (userId, integration) => capture(userId, 'Integration Connected', {
    integration_name: integration.name,
    integration_type: integration.type,
  }),

  integrationDisconnected: (userId, integration) => capture(userId, 'Integration Disconnected', {
    integration_name: integration.name,
  }),

  // Feature usage
  featureUsed: (userId, featureName, metadata = {}) => capture(userId, 'Feature Used', {
    feature_name: featureName,
    ...metadata,
  }),

  // Search and navigation
  searched: (userId, query, resultCount) => capture(userId, 'Search Performed', {
    query,
    result_count: resultCount,
  }),

  pageViewed: (userId, pageName, properties = {}) => capture(userId, '$pageview', {
    $current_url: pageName,
    ...properties,
  }),

  // API usage
  apiCalled: (userId, endpoint, method, statusCode) => capture(userId, 'API Called', {
    endpoint,
    method,
    status_code: statusCode,
  }),
};

/**
 * Express middleware for automatic page view tracking
 */
export const trackingMiddleware = (req, res, next) => {
  if (!isInitialized || !posthogClient) {
    return next();
  }

  // Track API calls
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';

    // Only track API routes
    if (req.path.startsWith('/api')) {
      capture(userId, 'API Request', {
        path: req.path,
        method: req.method,
        status_code: res.statusCode,
        duration_ms: duration,
      });
    }
  });

  next();
};

/**
 * Health check for PostHog
 */
export const healthCheck = () => ({
  status: isInitialized ? 'healthy' : 'disabled',
  apiKey: process.env.POSTHOG_API_KEY ? 'configured' : 'not_configured',
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
});

/**
 * Flush all pending events and shutdown
 */
export const shutdown = async () => {
  if (posthogClient) {
    await posthogClient.shutdown();
    console.log('[PostHog] Shutdown complete');
  }
};

export default {
  initPostHog,
  capture,
  identify,
  alias,
  groupIdentify,
  isFeatureEnabled,
  getFeatureFlagValue,
  getAllFeatureFlags,
  events,
  trackingMiddleware,
  healthCheck,
  shutdown,
};
