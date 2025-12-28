import { Download, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

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
 * Get status icon and style
 */
const getStatusInfo = (status) => {
  switch (status) {
    case 'paid':
      return {
        icon: CheckCircle,
        className: 'text-green-600',
        label: 'Paid',
      };
    case 'open':
      return {
        icon: Clock,
        className: 'text-blue-600',
        label: 'Open',
      };
    case 'void':
    case 'uncollectible':
      return {
        icon: XCircle,
        className: 'text-slate-400',
        label: status === 'void' ? 'Void' : 'Uncollectible',
      };
    case 'draft':
      return {
        icon: AlertCircle,
        className: 'text-slate-500',
        label: 'Draft',
      };
    default:
      return {
        icon: AlertCircle,
        className: 'text-slate-500',
        label: status,
      };
  }
};

/**
 * InvoiceRow - Single invoice row
 */
const InvoiceRow = ({ invoice, onDownload }) => {
  const statusInfo = getStatusInfo(invoice.status);
  const StatusIcon = statusInfo.icon;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="py-4 px-4">
        <span className="font-mono text-sm text-slate-600">
          {invoice.number || invoice.id.slice(-8).toUpperCase()}
        </span>
      </td>
      <td className="py-4 px-4 text-slate-600">
        {formatDate(invoice.created)}
      </td>
      <td className="py-4 px-4">
        <div className={`flex items-center ${statusInfo.className}`}>
          <StatusIcon className="w-4 h-4 mr-1.5" />
          <span className="text-sm capitalize">{statusInfo.label}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-right font-medium text-slate-900">
        {formatAmount(invoice.amount_due || invoice.total, invoice.currency)}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {invoice.invoice_pdf && (
            <button
              onClick={() => onDownload?.(invoice)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {invoice.hosted_invoice_url && (
            <a
              href={invoice.hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="View Invoice"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
};

/**
 * InvoiceList - Display list of invoices
 */
const InvoiceList = ({ invoices = [], onDownload, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-2">No invoices yet</div>
        <p className="text-sm text-slate-500">
          Invoices will appear here once you make a payment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoice
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Date
            </th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onDownload={onDownload}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
