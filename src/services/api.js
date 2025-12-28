/**
 * API Service - Centralized API client for backend communication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Make an API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * API methods for billing operations
 */
export const billingApi = {
  // Health check
  health: () => apiRequest('/api/health'),

  // Customer operations
  createCustomer: (data) => apiRequest('/api/customers', {
    method: 'POST',
    body: data,
  }),

  getCustomer: (customerId) => apiRequest(`/api/customers/${customerId}`),

  // Payment Intent operations
  createPaymentIntent: (data) => apiRequest('/api/payment-intents', {
    method: 'POST',
    body: data,
  }),

  getPaymentIntent: (paymentIntentId) => apiRequest(`/api/payment-intents/${paymentIntentId}`),

  // Subscription operations
  createSubscription: (data) => apiRequest('/api/subscriptions', {
    method: 'POST',
    body: data,
  }),

  getSubscription: (subscriptionId) => apiRequest(`/api/subscriptions/${subscriptionId}`),

  getCustomerSubscriptions: (customerId) => apiRequest(`/api/customers/${customerId}/subscriptions`),

  cancelSubscription: (subscriptionId, cancelAtPeriodEnd = true) => apiRequest(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: { cancelAtPeriodEnd },
  }),

  resumeSubscription: (subscriptionId) => apiRequest(`/api/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
  }),

  // Product operations
  getProducts: () => apiRequest('/api/products'),

  getProductPrices: (productId) => apiRequest(`/api/products/${productId}/prices`),

  // Invoice operations
  getCustomerInvoices: (customerId, limit = 10) => apiRequest(`/api/customers/${customerId}/invoices?limit=${limit}`),

  getInvoicePdf: (invoiceId) => apiRequest(`/api/invoices/${invoiceId}/pdf`),

  // Payment method operations
  createSetupIntent: (customerId) => apiRequest('/api/setup-intents', {
    method: 'POST',
    body: { customerId },
  }),

  getCustomerPaymentMethods: (customerId) => apiRequest(`/api/customers/${customerId}/payment-methods`),

  deletePaymentMethod: (paymentMethodId) => apiRequest(`/api/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  }),

  // Billing portal
  createBillingPortalSession: (customerId, returnUrl) => apiRequest('/api/billing-portal', {
    method: 'POST',
    body: { customerId, returnUrl },
  }),
};

export default billingApi;
