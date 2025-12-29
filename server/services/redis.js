import Redis from 'ioredis';

/**
 * Fly Redis Connection Service
 * Connects to Redis on Fly.io using the REDIS_URL environment variable
 *
 * For Fly.io Redis (Upstash), the URL format is:
 * redis://default:password@fly-app-name.upstash.io:6379
 */

let redisClient = null;
let isConnected = false;

/**
 * Get or create Redis client instance
 * Uses singleton pattern to maintain single connection
 */
export const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || process.env.FLY_REDIS_URL;

  if (!redisUrl) {
    console.warn('[Redis] No REDIS_URL configured. Redis features disabled.');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
      enableReadyCheck: true,
      lazyConnect: false,
      showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
      // TLS for Fly.io Upstash Redis
      tls: redisUrl.includes('upstash.io') ? {} : undefined,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected to Redis server');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Attempting to reconnect...');
    });

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error.message);
    return null;
  }
};

/**
 * Check if Redis is connected and healthy
 */
export const isRedisConnected = () => isConnected;

/**
 * Redis health check
 */
export const redisHealthCheck = async () => {
  const client = getRedisClient();
  if (!client) {
    return { status: 'disabled', message: 'Redis not configured' };
  }

  try {
    const pingResult = await client.ping();
    return {
      status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
      connected: isConnected,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get a cached value
   */
  get: async (key) => {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Redis] Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Set a cached value with optional TTL (in seconds)
   */
  set: async (key, value, ttlSeconds = 3600) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('[Redis] Cache set error:', error.message);
      return false;
    }
  },

  /**
   * Delete a cached value
   */
  del: async (key) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('[Redis] Cache delete error:', error.message);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  exists: async (key) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
      return (await client.exists(key)) === 1;
    } catch (error) {
      console.error('[Redis] Cache exists error:', error.message);
      return false;
    }
  },

  /**
   * Increment a counter
   */
  incr: async (key) => {
    const client = getRedisClient();
    if (!client) return null;

    try {
      return await client.incr(key);
    } catch (error) {
      console.error('[Redis] Cache incr error:', error.message);
      return null;
    }
  },

  /**
   * Get all keys matching a pattern
   */
  keys: async (pattern) => {
    const client = getRedisClient();
    if (!client) return [];

    try {
      return await client.keys(pattern);
    } catch (error) {
      console.error('[Redis] Cache keys error:', error.message);
      return [];
    }
  },
};

/**
 * Session store for user sessions
 */
export const sessionStore = {
  set: (sessionId, data, ttlSeconds = 86400) => cache.set(`session:${sessionId}`, data, ttlSeconds),
  get: (sessionId) => cache.get(`session:${sessionId}`),
  del: (sessionId) => cache.del(`session:${sessionId}`),
};

/**
 * Rate limiting helper
 */
export const rateLimit = {
  /**
   * Check if request should be rate limited
   * @returns {boolean} true if should block, false if allowed
   */
  check: async (key, maxRequests = 100, windowSeconds = 60) => {
    const client = getRedisClient();
    if (!client) return false; // Allow if Redis not available

    const redisKey = `ratelimit:${key}`;

    try {
      const current = await client.incr(redisKey);

      if (current === 1) {
        await client.expire(redisKey, windowSeconds);
      }

      return current > maxRequests;
    } catch (error) {
      console.error('[Redis] Rate limit error:', error.message);
      return false; // Allow on error
    }
  },

  /**
   * Get remaining requests
   */
  remaining: async (key, maxRequests = 100) => {
    const client = getRedisClient();
    if (!client) return maxRequests;

    try {
      const current = await client.get(`ratelimit:${key}`);
      return Math.max(0, maxRequests - (parseInt(current) || 0));
    } catch (error) {
      return maxRequests;
    }
  },
};

/**
 * Pub/Sub for real-time events
 */
export const pubsub = {
  publish: async (channel, message) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[Redis] Publish error:', error.message);
      return false;
    }
  },

  subscribe: async (channel, callback) => {
    const redisUrl = process.env.REDIS_URL || process.env.FLY_REDIS_URL;
    if (!redisUrl) return null;

    try {
      // Create a separate subscriber connection
      const subscriber = new Redis(redisUrl);

      await subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            callback(JSON.parse(message));
          } catch {
            callback(message);
          }
        }
      });

      return subscriber;
    } catch (error) {
      console.error('[Redis] Subscribe error:', error.message);
      return null;
    }
  },
};

/**
 * Graceful shutdown
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('[Redis] Connection closed gracefully');
  }
};

export default {
  getRedisClient,
  isRedisConnected,
  redisHealthCheck,
  cache,
  sessionStore,
  rateLimit,
  pubsub,
  closeRedisConnection,
};
