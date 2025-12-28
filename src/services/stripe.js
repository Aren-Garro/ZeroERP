/**
 * Stripe Service - Frontend Stripe SDK initialization
 */

import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise = null;

/**
 * Get the Stripe instance (lazy loaded)
 */
export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

/**
 * Check if Stripe is configured
 */
export const isStripeConfigured = () => {
  return !!stripePublishableKey;
};

/**
 * Stripe Elements appearance configuration
 */
export const stripeElementsAppearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0f172a',
    colorBackground: '#ffffff',
    colorText: '#1e293b',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e2e8f0',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #0f172a',
      boxShadow: '0 0 0 1px #0f172a',
    },
    '.Label': {
      fontWeight: '500',
      color: '#475569',
    },
  },
};

export default {
  getStripe,
  isStripeConfigured,
  stripeElementsAppearance,
};
