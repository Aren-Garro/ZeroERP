import { Calendar, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Format date from Unix timestamp
 */
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency amount
 */
const formatAmount = (amount, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

/**
 * Get status badge style
 */
const getStatusStyle = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'trialing':
      return 'bg-blue-100 text-blue-700';
    case 'past_due':
      return 'bg-yellow-100 text-yellow-700';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

/**
 * SubscriptionCard - Display subscription details
 */
const SubscriptionCard = ({
  subscription,
  onCancel,
  onResume,
  loading = false,
}) => {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const product = price?.product;

  const productName = typeof product === 'object' ? product.name : 'Subscription';
  const interval = price?.recurring?.interval || 'month';
  const intervalCount = price?.recurring?.interval_count || 1;
  const amount = price?.unit_amount || 0;
  const currency = price?.currency || 'usd';

  const isCanceling = subscription.cancel_at_period_end;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{productName}</h3>
          <p className="text-slate-500 text-sm">
            {formatAmount(amount, currency)} / {intervalCount > 1 ? `${intervalCount} ` : ''}{interval}{intervalCount > 1 ? 's' : ''}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(subscription.status)}`}>
          {isCanceling ? 'Canceling' : subscription.status}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center text-slate-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {isCanceling ? (
              <>Cancels on {formatDate(subscription.cancel_at)}</>
            ) : (
              <>Next billing: {formatDate(subscription.current_period_end)}</>
            )}
          </span>
        </div>

        {subscription.default_payment_method && (
          <div className="flex items-center text-slate-600">
            <CreditCard className="w-4 h-4 mr-2" />
            <span>
              {subscription.default_payment_method.card?.brand?.toUpperCase()} ****
              {subscription.default_payment_method.card?.last4}
            </span>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Payment failed - please update payment method</span>
          </div>
        )}

        {subscription.status === 'active' && !isCanceling && (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            <span>Subscription active</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
        {isCanceling ? (
          <button
            onClick={() => onResume?.(subscription.id)}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Resume Subscription
          </button>
        ) : (
          <button
            onClick={() => onCancel?.(subscription.id)}
            disabled={loading || subscription.status !== 'active'}
            className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
