import posthog from 'posthog-js';

/**
 * PostHog Frontend Analytics
 * Provides event tracking, feature flags, and user analytics
 */

let isInitialized = false;

/**
 * Initialize PostHog for the React frontend
 * Call this early in your application startup (e.g., in main.jsx)
 */
export const initPostHog = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog] No VITE_POSTHOG_API_KEY configured. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: host,
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture page leave events
      capture_pageleave: true,
      // Enable session recording (optional)
      enable_recording_console_log: false,
      // Respect Do Not Track
      respect_dnt: true,
      // Disable in development if needed
      loaded: (ph) => {
        if (import.meta.env.DEV) {
          // Optionally disable in development
          // ph.opt_out_capturing();
        }
      },
      // Autocapture settings
      autocapture: {
        dom_event_allowlist: ['click', 'submit'],
        element_allowlist: ['button', 'a', 'input', 'select'],
      },
    });

    isInitialized = true;
    console.log('[PostHog] Frontend initialized successfully');
  } catch (error) {
    console.error('[PostHog] Frontend initialization failed:', error.message);
  }
};

/**
 * Capture a custom event
 */
export const capture = (event, properties = {}) => {
  if (!isInitialized) return;
  posthog.capture(event, properties);
};

/**
 * Identify a user
 */
export const identify = (distinctId, properties = {}) => {
  if (!isInitialized) return;
  posthog.identify(distinctId, properties);
};

/**
 * Reset user identity (on logout)
 */
export const reset = () => {
  if (!isInitialized) return;
  posthog.reset();
};

/**
 * Set user properties
 */
export const setPersonProperties = (properties) => {
  if (!isInitialized) return;
  posthog.people.set(properties);
};

/**
 * Set user properties once (won't overwrite existing)
 */
export const setPersonPropertiesOnce = (properties) => {
  if (!isInitialized) return;
  posthog.people.set_once(properties);
};

/**
 * Create an alias for the current user
 */
export const alias = (alias) => {
  if (!isInitialized) return;
  posthog.alias(alias);
};

/**
 * Associate user with a group (company/organization)
 */
export const group = (groupType, groupKey, properties = {}) => {
  if (!isInitialized) return;
  posthog.group(groupType, groupKey, properties);
};

/**
 * Check if a feature flag is enabled
 */
export const isFeatureEnabled = (flagKey, defaultValue = false) => {
  if (!isInitialized) return defaultValue;
  return posthog.isFeatureEnabled(flagKey) ?? defaultValue;
};

/**
 * Get feature flag value (for multivariate flags)
 */
export const getFeatureFlag = (flagKey, defaultValue = null) => {
  if (!isInitialized) return defaultValue;
  return posthog.getFeatureFlag(flagKey) ?? defaultValue;
};

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = () => {
  if (!isInitialized) return {};
  return posthog.featureFlags.getFlagVariants() || {};
};

/**
 * Reload feature flags
 */
export const reloadFeatureFlags = () => {
  if (!isInitialized) return;
  posthog.reloadFeatureFlags();
};

/**
 * Register properties to be sent with every event
 */
export const register = (properties) => {
  if (!isInitialized) return;
  posthog.register(properties);
};

/**
 * Unregister a property
 */
export const unregister = (propertyName) => {
  if (!isInitialized) return;
  posthog.unregister(propertyName);
};

/**
 * Opt user out of tracking
 */
export const optOut = () => {
  if (!isInitialized) return;
  posthog.opt_out_capturing();
};

/**
 * Opt user back into tracking
 */
export const optIn = () => {
  if (!isInitialized) return;
  posthog.opt_in_capturing();
};

/**
 * Check if user has opted out
 */
export const hasOptedOut = () => {
  if (!isInitialized) return false;
  return posthog.has_opted_out_capturing();
};

/**
 * ============================================================================
 * PRE-DEFINED EVENTS FOR ERP
 * ============================================================================
 */

export const events = {
  // Navigation events
  pageViewed: (pageName, properties = {}) => capture('Page Viewed', { page_name: pageName, ...properties }),

  // Order events
  orderCreated: (order) => capture('Order Created', {
    order_id: order.id,
    total: order.total,
    item_count: order.items?.length || 0,
  }),

  orderViewed: (order) => capture('Order Viewed', { order_id: order.id }),

  // Inventory events
  inventorySearched: (query, resultCount) => capture('Inventory Searched', {
    query,
    result_count: resultCount,
  }),

  inventoryItemViewed: (item) => capture('Inventory Item Viewed', {
    sku: item.sku,
    product_name: item.name,
  }),

  // Purchase Order events
  poCreated: (po) => capture('Purchase Order Created', {
    po_id: po.id,
    supplier: po.supplier,
    total: po.total,
  }),

  // Integration events
  integrationConnected: (integration) => capture('Integration Connected', {
    integration_name: integration.name,
    integration_type: integration.category,
  }),

  integrationDisconnected: (integration) => capture('Integration Disconnected', {
    integration_name: integration.name,
  }),

  // Feature usage
  featureUsed: (featureName, metadata = {}) => capture('Feature Used', {
    feature_name: featureName,
    ...metadata,
  }),

  // Search
  searched: (query, section, resultCount) => capture('Search Performed', {
    query,
    section,
    result_count: resultCount,
  }),

  // Export events
  dataExported: (type, format, count) => capture('Data Exported', {
    export_type: type,
    format,
    record_count: count,
  }),

  // Settings
  settingsChanged: (setting, newValue) => capture('Settings Changed', {
    setting_name: setting,
    new_value: newValue,
  }),

  // Billing
  billingPortalOpened: () => capture('Billing Portal Opened'),
  subscriptionChanged: (plan) => capture('Subscription Changed', { plan }),
  paymentMethodAdded: () => capture('Payment Method Added'),
};

/**
 * React hook for PostHog
 */
export const usePostHog = () => {
  return {
    capture,
    identify,
    reset,
    isFeatureEnabled,
    getFeatureFlag,
    events,
  };
};

export default {
  initPostHog,
  capture,
  identify,
  reset,
  setPersonProperties,
  setPersonPropertiesOnce,
  alias,
  group,
  isFeatureEnabled,
  getFeatureFlag,
  getAllFeatureFlags,
  reloadFeatureFlags,
  register,
  unregister,
  optOut,
  optIn,
  hasOptedOut,
  events,
  usePostHog,
};
