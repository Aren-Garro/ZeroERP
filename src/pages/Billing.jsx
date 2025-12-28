import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { CreditCard, Receipt, Package, Settings, Plus, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { getStripe, isStripeConfigured, stripeElementsAppearance } from '../services/stripe';
import {
  PaymentForm,
  SubscriptionCard,
  InvoiceList,
  PaymentMethodCard,
  PricingCard,
} from '../components/billing';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

/**
 * Billing page - Manage subscriptions, payments, and invoices
 */
const Billing = ({
  customerId,
  subscriptions,
  invoices,
  paymentMethods,
  loading,
  error,
  onCreateCustomer,
  onFetchSubscriptions,
  onCancelSubscription,
  onResumeSubscription,
  onFetchInvoices,
  onFetchPaymentMethods,
  onDeletePaymentMethod,
  onCreatePaymentIntent,
  onOpenBillingPortal,
  onCheckApiHealth,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [apiHealthy, setApiHealthy] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await onCheckApiHealth?.();
      setApiHealthy(healthy);
    };
    checkHealth();
  }, [onCheckApiHealth]);

  // Fetch data when customer ID changes
  useEffect(() => {
    if (customerId) {
      onFetchSubscriptions?.();
      onFetchInvoices?.();
      onFetchPaymentMethods?.();
    }
  }, [customerId, onFetchSubscriptions, onFetchInvoices, onFetchPaymentMethods]);

  // Handle creating a new customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!customerEmail || !customerName) return;

    setIsCreatingCustomer(true);
    try {
      await onCreateCustomer?.(customerEmail, customerName);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Handle making a one-time payment
  const handleMakePayment = async (amount = 10) => {
    try {
      const { clientSecret } = await onCreatePaymentIntent?.(amount);
      setPaymentClientSecret(clientSecret);
      setIsPaymentModalOpen(true);
    } catch (err) {
      console.error('Error creating payment intent:', err);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentIntent) => {
    setIsPaymentModalOpen(false);
    setPaymentClientSecret(null);
    onFetchInvoices?.();
  };

  // Handle downloading invoice
  const handleDownloadInvoice = (invoice) => {
    if (invoice.invoice_pdf) {
      window.open(invoice.invoice_pdf, '_blank');
    }
  };

  const stripeConfigured = isStripeConfigured();

  // Show configuration warning
  if (!stripeConfigured) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Billing</h1>
        <Card>
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Stripe Not Configured</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              To enable billing, add your Stripe API keys to the environment configuration.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left max-w-lg mx-auto">
              <p className="text-sm font-mono text-slate-700 mb-2"># Add to .env file:</p>
              <p className="text-sm font-mono text-slate-600">VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
              <p className="text-sm font-mono text-slate-600">STRIPE_SECRET_KEY=sk_test_...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show API health warning
  if (apiHealthy === false) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Billing</h1>
        <Card>
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Billing API Unavailable</h2>
            <p className="text-slate-600 mb-4">
              The billing server is not running or unreachable.
            </p>
            <p className="text-sm text-slate-500">
              Start the backend server with: <code className="bg-slate-100 px-2 py-1 rounded">npm run dev:backend</code>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Show customer creation form if no customer
  if (!customerId) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Billing</h1>
        <Card>
          <div className="p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Set Up Billing</h2>
              <p className="text-slate-600">
                Create a customer account to manage subscriptions and payments.
              </p>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingCustomer || !customerEmail || !customerName}
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isCreatingCustomer ? 'Creating...' : 'Create Billing Account'}
              </button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'subscriptions', label: 'Subscriptions', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <button
          onClick={() => onOpenBillingPortal?.()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Manage in Stripe
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Subscription Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Active Subscriptions</h3>
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {subscriptions.filter(s => s.status === 'active').length}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {subscriptions.length} total subscriptions
            </p>
          </Card>

          {/* Payment Methods Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Payment Methods</h3>
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{paymentMethods.length}</p>
            <p className="text-sm text-slate-500 mt-1">Saved cards</p>
          </Card>

          {/* Recent Invoices Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
              <Receipt className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {invoices.filter(i => i.status === 'paid').length}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Paid in last 30 days
            </p>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleMakePayment(10)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Make a Payment
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Package className="w-4 h-4" />
                View Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                View Invoices
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Subscriptions</h3>
              <p className="text-slate-500 mb-4">
                You don't have any active subscriptions yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onCancel={onCancelSubscription}
                  onResume={onResumeSubscription}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <InvoiceList
          invoices={invoices}
          onDownload={handleDownloadInvoice}
          loading={loading}
        />
      )}

      {activeTab === 'payment-methods' && (
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Payment Methods</h3>
              <p className="text-slate-500 mb-4">
                Add a payment method to enable subscriptions and payments.
              </p>
              <button
                onClick={() => onOpenBillingPortal?.()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paymentMethods.map((pm, index) => (
                <PaymentMethodCard
                  key={pm.id}
                  paymentMethod={pm}
                  isDefault={index === 0}
                  onDelete={onDeletePaymentMethod}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentClientSecret && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentClientSecret(null);
          }}
          title="Complete Payment"
        >
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret: paymentClientSecret,
              appearance: stripeElementsAppearance,
            }}
          >
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onError={(err) => console.error('Payment error:', err)}
              buttonText="Pay $10.00"
            />
          </Elements>
        </Modal>
      )}
    </div>
  );
};

export default Billing;
