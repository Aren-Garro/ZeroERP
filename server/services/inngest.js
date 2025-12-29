import { Inngest } from 'inngest';
import { serve } from 'inngest/express';

/**
 * Inngest Background Jobs & Event-Driven Workflows
 * Provides reliable background job processing and event orchestration
 */

// Initialize Inngest client
const inngest = new Inngest({
  id: 'zeroerp',
  name: 'ZeroERP',
  // Event key for sending events (optional in development)
  eventKey: process.env.INNGEST_EVENT_KEY,
});

/**
 * ============================================================================
 * INNGEST FUNCTIONS (Background Jobs)
 * ============================================================================
 */

/**
 * Process new order - triggered when order.created event is sent
 */
const processOrder = inngest.createFunction(
  { id: 'process-order', name: 'Process New Order' },
  { event: 'order/created' },
  async ({ event, step }) => {
    const order = event.data;

    // Step 1: Validate inventory
    await step.run('validate-inventory', async () => {
      console.log(`[Inngest] Validating inventory for order ${order.id}`);
      // In production, check stock levels
      return { validated: true };
    });

    // Step 2: Reserve inventory
    await step.run('reserve-inventory', async () => {
      console.log(`[Inngest] Reserving inventory for order ${order.id}`);
      // In production, update stock levels
      return { reserved: true };
    });

    // Step 3: Send confirmation email (with delay)
    await step.sleep('wait-before-email', '5s');
    await step.run('send-confirmation', async () => {
      console.log(`[Inngest] Sending order confirmation for ${order.id}`);
      // In production, integrate with email service
      return { emailSent: true };
    });

    return { orderId: order.id, status: 'processed' };
  }
);

/**
 * Handle low stock alerts
 */
const handleLowStock = inngest.createFunction(
  { id: 'handle-low-stock', name: 'Handle Low Stock Alert' },
  { event: 'inventory/low' },
  async ({ event, step }) => {
    const item = event.data;

    // Step 1: Create purchase order suggestion
    const suggestion = await step.run('create-po-suggestion', async () => {
      console.log(`[Inngest] Creating PO suggestion for ${item.sku}`);
      return {
        sku: item.sku,
        name: item.name,
        suggestedQuantity: item.safetyStock * 2,
        currentStock: item.currentStock,
      };
    });

    // Step 2: Notify team
    await step.run('notify-team', async () => {
      console.log(`[Inngest] Notifying team about low stock: ${item.name}`);
      // In production, send Slack/email notification
      return { notified: true };
    });

    return { suggestion, status: 'alerted' };
  }
);

/**
 * Sync data with external systems
 */
const syncExternalSystem = inngest.createFunction(
  {
    id: 'sync-external',
    name: 'Sync External System',
    retries: 3, // Retry up to 3 times on failure
  },
  { event: 'sync/requested' },
  async ({ event, step }) => {
    const { system, action, data } = event.data;

    const result = await step.run('sync-data', async () => {
      console.log(`[Inngest] Syncing ${action} with ${system}`);
      // In production, call external API
      return { synced: true, system, action };
    });

    return result;
  }
);

/**
 * Generate daily reports - scheduled job
 */
const generateDailyReport = inngest.createFunction(
  { id: 'daily-report', name: 'Generate Daily Report' },
  { cron: '0 8 * * *' }, // Run at 8 AM daily
  async ({ step }) => {
    // Step 1: Gather metrics
    const metrics = await step.run('gather-metrics', async () => {
      console.log('[Inngest] Gathering daily metrics');
      return {
        ordersToday: 0, // Would query database
        revenue: 0,
        lowStockItems: 0,
      };
    });

    // Step 2: Generate report
    await step.run('generate-report', async () => {
      console.log('[Inngest] Generating report with metrics:', metrics);
      return { reportGenerated: true };
    });

    // Step 3: Send report
    await step.run('send-report', async () => {
      console.log('[Inngest] Sending daily report');
      return { sent: true };
    });

    return { metrics, status: 'completed' };
  }
);

/**
 * Webhook retry handler - retry failed webhook deliveries
 */
const retryWebhook = inngest.createFunction(
  {
    id: 'retry-webhook',
    name: 'Retry Failed Webhook',
    retries: 5,
  },
  { event: 'webhook/failed' },
  async ({ event, step }) => {
    const { url, payload, attempt } = event.data;

    // Exponential backoff
    const waitTime = Math.pow(2, attempt) * 1000;
    await step.sleep('backoff', `${waitTime}ms`);

    const result = await step.run('deliver-webhook', async () => {
      console.log(`[Inngest] Retrying webhook delivery to ${url} (attempt ${attempt + 1})`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status}`);
      }

      return { delivered: true, statusCode: response.status };
    });

    return result;
  }
);

/**
 * All Inngest functions to register
 */
const functions = [
  processOrder,
  handleLowStock,
  syncExternalSystem,
  generateDailyReport,
  retryWebhook,
];

/**
 * ============================================================================
 * EXPRESS MIDDLEWARE
 * ============================================================================
 */

/**
 * Get the Inngest serve middleware for Express
 * Mount this at /api/inngest
 */
export const getInngestMiddleware = () => {
  return serve({
    client: inngest,
    functions,
  });
};

/**
 * ============================================================================
 * EVENT SENDING HELPERS
 * ============================================================================
 */

/**
 * Send an event to Inngest
 */
export const sendEvent = async (name, data) => {
  try {
    await inngest.send({ name, data });
    console.log(`[Inngest] Event sent: ${name}`);
    return true;
  } catch (error) {
    console.error(`[Inngest] Failed to send event ${name}:`, error.message);
    return false;
  }
};

/**
 * Pre-defined event senders for ERP
 */
export const events = {
  orderCreated: (order) => sendEvent('order/created', order),
  orderShipped: (order) => sendEvent('order/shipped', order),
  orderCancelled: (order) => sendEvent('order/cancelled', order),

  inventoryLow: (item) => sendEvent('inventory/low', item),
  inventoryUpdated: (item) => sendEvent('inventory/updated', item),

  poCreated: (po) => sendEvent('po/created', po),
  poReceived: (po) => sendEvent('po/received', po),

  syncRequested: (config) => sendEvent('sync/requested', config),
  webhookFailed: (webhook) => sendEvent('webhook/failed', webhook),
};

/**
 * Health check for Inngest
 */
export const healthCheck = () => ({
  status: process.env.INNGEST_EVENT_KEY ? 'configured' : 'development',
  functionsRegistered: functions.length,
  functions: functions.map(f => f.id || 'unknown'),
});

export { inngest };

export default {
  inngest,
  getInngestMiddleware,
  sendEvent,
  events,
  healthCheck,
};
