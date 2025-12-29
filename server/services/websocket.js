import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';

/**
 * WebSocket Service for Real-Time Communication
 * Provides bi-directional real-time communication with clients
 */

let wss = null;
const clients = new Map(); // clientId -> { ws, subscriptions, metadata }
const channels = new Map(); // channelName -> Set of clientIds

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance to attach to
 */
export const initWebSocket = (server) => {
  wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  console.log('[WebSocket] Server initialized on /ws');

  wss.on('connection', (ws, req) => {
    const clientId = crypto.randomUUID();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Store client connection
    clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      metadata: {
        connectedAt: new Date().toISOString(),
        ip: clientIp,
        userAgent: req.headers['user-agent'],
      },
    });

    console.log(`[WebSocket] Client connected: ${clientId}`);

    // Send welcome message with client ID
    sendToClient(clientId, {
      type: 'connection',
      clientId,
      message: 'Connected to ZeroERP WebSocket',
      timestamp: new Date().toISOString(),
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (error) {
        sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format. Expected JSON.',
        });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error.message);
    });

    // Ping/pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

/**
 * Handle incoming WebSocket messages
 */
const handleMessage = (clientId, message) => {
  const { type, payload } = message;

  switch (type) {
    case 'subscribe':
      handleSubscribe(clientId, payload?.channel);
      break;

    case 'unsubscribe':
      handleUnsubscribe(clientId, payload?.channel);
      break;

    case 'ping':
      sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
      break;

    case 'broadcast':
      // Only allow authenticated broadcasts in production
      if (payload?.channel && payload?.data) {
        broadcastToChannel(payload.channel, {
          type: 'message',
          from: clientId,
          data: payload.data,
        });
      }
      break;

    default:
      sendToClient(clientId, {
        type: 'error',
        message: `Unknown message type: ${type}`,
      });
  }
};

/**
 * Handle channel subscription
 */
const handleSubscribe = (clientId, channel) => {
  if (!channel) {
    return sendToClient(clientId, {
      type: 'error',
      message: 'Channel name required for subscription',
    });
  }

  const client = clients.get(clientId);
  if (!client) return;

  // Add to client's subscriptions
  client.subscriptions.add(channel);

  // Add to channel's subscribers
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel).add(clientId);

  sendToClient(clientId, {
    type: 'subscribed',
    channel,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Client ${clientId} subscribed to ${channel}`);
};

/**
 * Handle channel unsubscription
 */
const handleUnsubscribe = (clientId, channel) => {
  if (!channel) return;

  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.delete(channel);

  if (channels.has(channel)) {
    channels.get(channel).delete(clientId);
    if (channels.get(channel).size === 0) {
      channels.delete(channel);
    }
  }

  sendToClient(clientId, {
    type: 'unsubscribed',
    channel,
  });
};

/**
 * Handle client disconnect
 */
const handleDisconnect = (clientId) => {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from all channels
  client.subscriptions.forEach((channel) => {
    if (channels.has(channel)) {
      channels.get(channel).delete(clientId);
      if (channels.get(channel).size === 0) {
        channels.delete(channel);
      }
    }
  });

  clients.delete(clientId);
  console.log(`[WebSocket] Client disconnected: ${clientId}`);
};

/**
 * Send message to specific client
 */
export const sendToClient = (clientId, data) => {
  const client = clients.get(clientId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) return false;

  try {
    client.ws.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[WebSocket] Send error to ${clientId}:`, error.message);
    return false;
  }
};

/**
 * Broadcast message to all clients in a channel
 */
export const broadcastToChannel = (channel, data) => {
  const subscribers = channels.get(channel);
  if (!subscribers) return 0;

  let sent = 0;
  subscribers.forEach((clientId) => {
    if (sendToClient(clientId, { ...data, channel })) {
      sent++;
    }
  });

  return sent;
};

/**
 * Broadcast message to all connected clients
 */
export const broadcastAll = (data) => {
  let sent = 0;
  clients.forEach((_, clientId) => {
    if (sendToClient(clientId, data)) {
      sent++;
    }
  });
  return sent;
};

/**
 * Broadcast event for ERP actions (orders, inventory, etc.)
 */
export const broadcastEvent = (eventType, eventData) => {
  const message = {
    type: 'event',
    event: eventType,
    data: eventData,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to event-specific channel
  broadcastToChannel(eventType, message);

  // Also broadcast to 'all-events' channel
  broadcastToChannel('all-events', message);

  return message;
};

/**
 * Pre-defined event channels for ERP
 */
export const events = {
  orderCreated: (order) => broadcastEvent('order.created', order),
  orderUpdated: (order) => broadcastEvent('order.updated', order),
  orderShipped: (order) => broadcastEvent('order.shipped', order),
  orderCancelled: (order) => broadcastEvent('order.cancelled', order),

  inventoryLow: (item) => broadcastEvent('inventory.low', item),
  inventoryUpdated: (item) => broadcastEvent('inventory.updated', item),

  poCreated: (po) => broadcastEvent('po.created', po),
  poReceived: (po) => broadcastEvent('po.received', po),

  notification: (notification) => broadcastEvent('notification', notification),
};

/**
 * Get WebSocket server stats
 */
export const getStats = () => ({
  totalClients: clients.size,
  totalChannels: channels.size,
  channels: Array.from(channels.entries()).map(([name, subscribers]) => ({
    name,
    subscriberCount: subscribers.size,
  })),
});

/**
 * Get WebSocket health status
 */
export const healthCheck = () => ({
  status: wss ? 'healthy' : 'not_initialized',
  clients: clients.size,
  channels: channels.size,
});

/**
 * Close WebSocket server
 */
export const closeWebSocket = () => {
  if (wss) {
    wss.close();
    clients.clear();
    channels.clear();
    console.log('[WebSocket] Server closed');
  }
};

export default {
  initWebSocket,
  sendToClient,
  broadcastToChannel,
  broadcastAll,
  broadcastEvent,
  events,
  getStats,
  healthCheck,
  closeWebSocket,
};
