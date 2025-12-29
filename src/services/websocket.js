/**
 * WebSocket Client Service
 * Provides real-time communication with the backend
 */

let ws = null;
let clientId = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const listeners = new Map(); // eventType -> Set of callbacks

/**
 * Get WebSocket URL based on current environment
 */
const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  return `${protocol}//${host}/ws`;
};

/**
 * Connect to WebSocket server
 */
export const connect = () => {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve(clientId);
      return;
    }

    const wsUrl = getWsUrl();
    console.log('[WebSocket] Connecting to', wsUrl);

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message, resolve);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        clientId = null;
        handleReconnect();
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        reject(error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      reject(error);
    }
  });
};

/**
 * Handle incoming WebSocket messages
 */
const handleMessage = (message, resolveConnection) => {
  const { type, channel, event, data } = message;

  switch (type) {
    case 'connection':
      clientId = message.clientId;
      console.log('[WebSocket] Assigned client ID:', clientId);
      if (resolveConnection) resolveConnection(clientId);
      break;

    case 'subscribed':
      console.log('[WebSocket] Subscribed to:', channel);
      break;

    case 'unsubscribed':
      console.log('[WebSocket] Unsubscribed from:', channel);
      break;

    case 'event':
      // Notify listeners for this event type
      notifyListeners(event, data);
      notifyListeners('*', { event, data }); // Wildcard listeners
      break;

    case 'message':
      notifyListeners(`channel:${channel}`, data);
      break;

    case 'pong':
      // Connection is alive
      break;

    case 'error':
      console.error('[WebSocket] Server error:', message.message);
      break;

    default:
      console.log('[WebSocket] Unknown message type:', type, message);
  }
};

/**
 * Notify registered listeners
 */
const notifyListeners = (eventType, data) => {
  const callbacks = listeners.get(eventType);
  if (callbacks) {
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('[WebSocket] Listener error:', error);
      }
    });
  }
};

/**
 * Handle reconnection with exponential backoff
 */
const handleReconnect = () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('[WebSocket] Max reconnection attempts reached');
    notifyListeners('disconnected', { permanent: true });
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

  setTimeout(() => {
    connect().catch(() => {
      // Will retry via onclose handler
    });
  }, delay);
};

/**
 * Disconnect from WebSocket server
 */
export const disconnect = () => {
  if (ws) {
    ws.close();
    ws = null;
    clientId = null;
  }
};

/**
 * Send a message to the server
 */
export const send = (type, payload = {}) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('[WebSocket] Not connected. Message not sent:', type);
    return false;
  }

  ws.send(JSON.stringify({ type, payload }));
  return true;
};

/**
 * Subscribe to a channel
 */
export const subscribe = (channel) => {
  return send('subscribe', { channel });
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribe = (channel) => {
  return send('unsubscribe', { channel });
};

/**
 * Broadcast a message to a channel
 */
export const broadcast = (channel, data) => {
  return send('broadcast', { channel, data });
};

/**
 * Register a listener for events
 */
export const on = (eventType, callback) => {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }
  listeners.get(eventType).add(callback);

  // Return unsubscribe function
  return () => {
    listeners.get(eventType)?.delete(callback);
  };
};

/**
 * Remove a listener
 */
export const off = (eventType, callback) => {
  listeners.get(eventType)?.delete(callback);
};

/**
 * Remove all listeners for an event type
 */
export const offAll = (eventType) => {
  listeners.delete(eventType);
};

/**
 * Check if connected
 */
export const isConnected = () => {
  return ws && ws.readyState === WebSocket.OPEN;
};

/**
 * Get current client ID
 */
export const getClientId = () => clientId;

/**
 * ============================================================================
 * PRE-DEFINED EVENT SUBSCRIPTIONS FOR ERP
 * ============================================================================
 */

export const subscribeToOrders = (callback) => {
  subscribe('order.created');
  subscribe('order.updated');
  subscribe('order.shipped');
  subscribe('order.cancelled');
  return on('order.*', callback);
};

export const subscribeToInventory = (callback) => {
  subscribe('inventory.low');
  subscribe('inventory.updated');
  return on('inventory.*', callback);
};

export const subscribeToPurchaseOrders = (callback) => {
  subscribe('po.created');
  subscribe('po.received');
  return on('po.*', callback);
};

export const subscribeToNotifications = (callback) => {
  subscribe('notification');
  return on('notification', callback);
};

export const subscribeToAll = (callback) => {
  subscribe('all-events');
  return on('*', callback);
};

/**
 * React hook for WebSocket
 */
export const useWebSocket = () => {
  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    off,
    isConnected,
    getClientId,
    subscribeToOrders,
    subscribeToInventory,
    subscribeToPurchaseOrders,
    subscribeToNotifications,
    subscribeToAll,
  };
};

export default {
  connect,
  disconnect,
  send,
  subscribe,
  unsubscribe,
  broadcast,
  on,
  off,
  offAll,
  isConnected,
  getClientId,
  subscribeToOrders,
  subscribeToInventory,
  subscribeToPurchaseOrders,
  subscribeToNotifications,
  subscribeToAll,
  useWebSocket,
};
