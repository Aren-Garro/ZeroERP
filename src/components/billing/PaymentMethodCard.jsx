import { CreditCard, Trash2 } from 'lucide-react';

/**
 * Get card brand icon/color
 */
const getCardBrandStyle = (brand) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'text-blue-600';
    case 'mastercard':
      return 'text-orange-500';
    case 'amex':
      return 'text-blue-500';
    case 'discover':
      return 'text-orange-600';
    default:
      return 'text-slate-600';
  }
};

/**
 * PaymentMethodCard - Display saved payment method
 */
const PaymentMethodCard = ({
  paymentMethod,
  isDefault = false,
  onDelete,
  loading = false,
}) => {
  const card = paymentMethod.card;

  if (!card) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg p-4 flex items-center justify-between ${isDefault ? 'border-slate-900' : 'border-slate-200'}`}>
      <div className="flex items-center">
        <div className={`mr-4 ${getCardBrandStyle(card.brand)}`}>
          <CreditCard className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">
              {card.brand?.toUpperCase()} •••• {card.last4}
            </span>
            {isDefault && (
              <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-medium rounded">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
          </p>
        </div>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(paymentMethod.id)}
          disabled={loading || isDefault}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDefault ? "Can't delete default payment method" : 'Remove payment method'}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default PaymentMethodCard;
