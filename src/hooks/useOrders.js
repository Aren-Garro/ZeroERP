import { useState, useMemo, useEffect } from 'react';
import { INITIAL_ORDERS } from '../data';

const STORAGE_KEY = 'zeroerp_orders';

/**
 * Load orders from localStorage or return initial data
 */
const loadOrders = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load orders from localStorage:', error);
  }
  return INITIAL_ORDERS;
};

/**
 * Custom hook for orders state management
 */
export const useOrders = () => {
  const [orders, setOrders] = useState(loadOrders);

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to save orders to localStorage:', error);
    }
  }, [orders]);

  // Derived state
  const pendingOrdersCount = useMemo(() =>
    orders.filter(o => o.status === 'Pending').length,
    [orders]
  );

  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'Pending'),
    [orders]
  );

  const shippedOrders = useMemo(() =>
    orders.filter(o => o.status === 'Shipped'),
    [orders]
  );

  const deliveredOrders = useMemo(() =>
    orders.filter(o => o.status === 'Delivered'),
    [orders]
  );

  const totalRevenue = useMemo(() =>
    orders.reduce((acc, order) => acc + order.total, 0),
    [orders]
  );

  // Payment-related derived state
  const unpaidOrders = useMemo(() =>
    orders.filter(o => o.paymentStatus === 'pending' || o.paymentStatus === 'failed'),
    [orders]
  );

  const paidOrders = useMemo(() =>
    orders.filter(o => o.paymentStatus === 'paid'),
    [orders]
  );

  const paidRevenue = useMemo(() =>
    paidOrders.reduce((acc, order) => acc + order.total, 0),
    [paidOrders]
  );

  // Actions
  const fulfillOrder = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Shipped' } : o
    ));
    return orderId;
  };

  const markDelivered = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Delivered' } : o
    ));
    return orderId;
  };

  const addOrder = (orderData) => {
    setOrders(prev => [...prev, orderData]);
    return orderData;
  };

  // Payment actions
  const updatePaymentStatus = (orderId, paymentStatus, paymentDetails = {}) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? {
            ...o,
            paymentStatus,
            paymentMethod: paymentDetails.paymentMethod || o.paymentMethod,
            paymentIntentId: paymentDetails.paymentIntentId || o.paymentIntentId,
          }
        : o
    ));
    return orderId;
  };

  const markOrderPaid = (orderId, paymentIntentId, paymentMethod = 'card') => {
    return updatePaymentStatus(orderId, 'paid', { paymentIntentId, paymentMethod });
  };

  const markPaymentFailed = (orderId) => {
    return updatePaymentStatus(orderId, 'failed');
  };

  return {
    // State
    orders,

    // Derived state
    pendingOrdersCount,
    pendingOrders,
    shippedOrders,
    deliveredOrders,
    totalRevenue,
    unpaidOrders,
    paidOrders,
    paidRevenue,

    // Actions
    fulfillOrder,
    markDelivered,
    addOrder,
    updatePaymentStatus,
    markOrderPaid,
    markPaymentFailed,
  };
};
