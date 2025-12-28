import { useState, useEffect, useCallback, useMemo } from 'react';
import { billingApi } from '../services/api';

const STORAGE_KEY = 'zeroerp_billing';

/**
 * Load billing data from localStorage
 */
const loadBillingData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load billing data:', error);
  }
  return {
    customerId: null,
    subscriptions: [],
    invoices: [],
    paymentMethods: [],
  };
};

/**
 * Custom hook for billing/payment state management
 */
export const useBilling = () => {
  const [billingData, setBillingData] = useState(loadBillingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist billing data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(billingData));
    } catch (error) {
      console.error('Failed to save billing data:', error);
    }
  }, [billingData]);

  // Check API health
  const checkApiHealth = useCallback(async () => {
    try {
      const health = await billingApi.health();
      return health.stripe;
    } catch {
      return false;
    }
  }, []);

  // Create a new customer
  const createCustomer = useCallback(async (email, name, metadata = {}) => {
    setLoading(true);
    setError(null);
    try {
      const customer = await billingApi.createCustomer({ email, name, metadata });
      setBillingData(prev => ({ ...prev, customerId: customer.id }));
      return customer;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer details
  const getCustomer = useCallback(async () => {
    if (!billingData.customerId) return null;
    setLoading(true);
    setError(null);
    try {
      const customer = await billingApi.getCustomer(billingData.customerId);
      return customer;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Create payment intent for one-time payment
  const createPaymentIntent = useCallback(async (amount, metadata = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.createPaymentIntent({
        amount,
        customerId: billingData.customerId,
        metadata,
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (!billingData.customerId) return [];
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.getCustomerSubscriptions(billingData.customerId);
      const subscriptions = result.data || [];
      setBillingData(prev => ({ ...prev, subscriptions }));
      return subscriptions;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Create subscription
  const createSubscription = useCallback(async (priceId, paymentMethodId) => {
    if (!billingData.customerId) {
      throw new Error('Customer ID required for subscription');
    }
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.createSubscription({
        customerId: billingData.customerId,
        priceId,
        paymentMethodId,
      });
      await fetchSubscriptions();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId, fetchSubscriptions]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId, cancelAtPeriodEnd = true) => {
    setLoading(true);
    setError(null);
    try {
      await billingApi.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
      await fetchSubscriptions();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions]);

  // Resume subscription
  const resumeSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    setError(null);
    try {
      await billingApi.resumeSubscription(subscriptionId);
      await fetchSubscriptions();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions]);

  // Fetch invoices
  const fetchInvoices = useCallback(async (limit = 10) => {
    if (!billingData.customerId) return [];
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.getCustomerInvoices(billingData.customerId, limit);
      const invoices = result.data || [];
      setBillingData(prev => ({ ...prev, invoices }));
      return invoices;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Get invoice PDF URL
  const getInvoicePdf = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.getInvoicePdf(invoiceId);
      return result.pdfUrl;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    if (!billingData.customerId) return [];
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.getCustomerPaymentMethods(billingData.customerId);
      const paymentMethods = result.data || [];
      setBillingData(prev => ({ ...prev, paymentMethods }));
      return paymentMethods;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Delete payment method
  const deletePaymentMethod = useCallback(async (paymentMethodId) => {
    setLoading(true);
    setError(null);
    try {
      await billingApi.deletePaymentMethod(paymentMethodId);
      await fetchPaymentMethods();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  // Create setup intent for adding payment method
  const createSetupIntent = useCallback(async () => {
    if (!billingData.customerId) {
      throw new Error('Customer ID required for setup intent');
    }
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.createSetupIntent(billingData.customerId);
      return result.clientSecret;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Open billing portal
  const openBillingPortal = useCallback(async (returnUrl) => {
    if (!billingData.customerId) {
      throw new Error('Customer ID required for billing portal');
    }
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.createBillingPortalSession(
        billingData.customerId,
        returnUrl || window.location.href
      );
      window.location.href = result.url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [billingData.customerId]);

  // Get products/plans
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await billingApi.getProducts();
      return result.data || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set customer ID (for linking existing customer)
  const setCustomerId = useCallback((customerId) => {
    setBillingData(prev => ({ ...prev, customerId }));
  }, []);

  // Clear billing data
  const clearBillingData = useCallback(() => {
    setBillingData({
      customerId: null,
      subscriptions: [],
      invoices: [],
      paymentMethods: [],
    });
  }, []);

  // Derived state
  const hasCustomer = useMemo(() => !!billingData.customerId, [billingData.customerId]);

  const activeSubscriptions = useMemo(() =>
    billingData.subscriptions.filter(s => s.status === 'active' || s.status === 'trialing'),
    [billingData.subscriptions]
  );

  const hasActiveSubscription = useMemo(() => activeSubscriptions.length > 0, [activeSubscriptions]);

  return {
    // State
    customerId: billingData.customerId,
    subscriptions: billingData.subscriptions,
    invoices: billingData.invoices,
    paymentMethods: billingData.paymentMethods,
    loading,
    error,

    // Derived state
    hasCustomer,
    activeSubscriptions,
    hasActiveSubscription,

    // Actions
    checkApiHealth,
    createCustomer,
    getCustomer,
    setCustomerId,
    createPaymentIntent,
    fetchSubscriptions,
    createSubscription,
    cancelSubscription,
    resumeSubscription,
    fetchInvoices,
    getInvoicePdf,
    fetchPaymentMethods,
    deletePaymentMethod,
    createSetupIntent,
    openBillingPortal,
    fetchProducts,
    clearBillingData,
  };
};
