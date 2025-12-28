import { Check } from 'lucide-react';

/**
 * Format currency amount
 */
const formatAmount = (amount, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

/**
 * PricingCard - Display pricing plan
 */
const PricingCard = ({
  product,
  price,
  features = [],
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  loading = false,
}) => {
  const productName = typeof product === 'object' ? product.name : product;
  const productDescription = typeof product === 'object' ? product.description : null;
  const interval = price?.recurring?.interval || 'month';
  const intervalCount = price?.recurring?.interval_count || 1;
  const amount = price?.unit_amount || 0;
  const currency = price?.currency || 'usd';

  return (
    <div className={`relative bg-white border rounded-xl p-6 flex flex-col ${
      isPopular ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">{productName}</h3>
        {productDescription && (
          <p className="text-sm text-slate-500 mt-1">{productDescription}</p>
        )}
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-slate-900">
          {formatAmount(amount, currency)}
        </span>
        <span className="text-slate-500">
          /{intervalCount > 1 ? `${intervalCount} ` : ''}{interval}{intervalCount > 1 ? 's' : ''}
        </span>
      </div>

      {features.length > 0 && (
        <ul className="space-y-3 mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => onSelect?.(price)}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-slate-100 text-slate-500 cursor-default'
            : isPopular
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
        } disabled:opacity-50`}
      >
        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </button>
    </div>
  );
};

export default PricingCard;
