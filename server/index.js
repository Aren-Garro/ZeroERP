import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe with secret key (supports STRIPE_SECRET_KEY or STRIPE_API)
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API;
const stripe = new Stripe(stripeKey);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Webhook endpoint needs raw body - must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('PaymentIntent failed:', event.data.object.id);
      break;
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object.id);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object.id);
      break;
    case 'invoice.paid':
      console.log('Invoice paid:', event.data.object.id);
      break;
    case 'invoice.payment_failed':
      console.log('Invoice payment failed:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// JSON body parser for other routes
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stripe: !!stripeKey });
});

// Create a customer
app.post('/api/customers', async (req, res) => {
  try {
    const { email, name, metadata } = req.body;
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });
    res.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await stripe.customers.retrieve(customerId);
    res.json(customer);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a payment intent for one-time payments
app.post('/api/payment-intents', async (req, res) => {
  try {
    const { amount, currency = 'usd', customerId, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment intent status
app.get('/api/payment-intents/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a subscription
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { customerId, priceId, paymentMethodId } = req.body;

    // Attach payment method to customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      status: subscription.status
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscription details
app.get('/api/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product', 'latest_invoice']
    });
    res.json(subscription);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// List customer subscriptions
app.get('/api/customers/:customerId/subscriptions', async (req, res) => {
  try {
    const { customerId } = req.params;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      expand: ['data.items.data.price.product']
    });
    res.json(subscriptions);
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtPeriodEnd = true } = req.body;

    let subscription;
    if (cancelAtPeriodEnd) {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    } else {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume subscription (if cancelled at period end)
app.post('/api/subscriptions/:subscriptionId/resume', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    res.json(subscription);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// List available products and prices
app.get('/api/products', async (req, res) => {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });
    res.json(products);
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({ error: error.message });
  }
});

// List prices for a product
app.get('/api/products/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const prices = await stripe.prices.list({
      product: productId,
      active: true
    });
    res.json(prices);
  } catch (error) {
    console.error('Error listing prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// List customer invoices
app.get('/api/customers/:customerId/invoices', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 10 } = req.query;

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: parseInt(limit)
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error listing invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoice PDF URL
app.get('/api/invoices/:invoiceId/pdf', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await stripe.invoices.retrieve(invoiceId);
    res.json({ pdfUrl: invoice.invoice_pdf });
  } catch (error) {
    console.error('Error getting invoice PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a setup intent for saving payment methods
app.post('/api/setup-intents', async (req, res) => {
  try {
    const { customerId } = req.body;
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// List customer payment methods
app.get('/api/customers/:customerId/payment-methods', async (req, res) => {
  try {
    const { customerId } = req.params;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error listing payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a payment method
app.delete('/api/payment-methods/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a billing portal session
app.post('/api/billing-portal', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || process.env.FRONTEND_URL
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the dist directory (production build)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ZeroERP server running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
  if (!stripeKey) {
    console.warn('Warning: No Stripe API key found (STRIPE_SECRET_KEY or STRIPE_API). Stripe operations will fail.');
  } else {
    console.log('Stripe API key configured successfully');
  }
});
