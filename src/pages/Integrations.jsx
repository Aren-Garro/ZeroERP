import { useState } from 'react';
import { Check, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui';
import { toast } from 'sonner';

const INTEGRATIONS = [
  // Infrastructure & Developer Tools
  {
    id: 'redis',
    name: 'Fly Redis',
    emoji: '🔴',
    status: 'connected',
    description: 'In-memory caching & session storage',
    lastSync: 'Active',
    category: 'Infrastructure'
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    emoji: '🔌',
    status: 'connected',
    description: 'Real-time bidirectional communication',
    lastSync: 'Active',
    category: 'Infrastructure'
  },
  {
    id: 'sentry',
    name: 'Sentry',
    emoji: '🐛',
    status: 'connected',
    description: 'Error tracking & performance monitoring',
    lastSync: 'Real-time',
    category: 'Infrastructure'
  },
  {
    id: 'inngest',
    name: 'Inngest',
    emoji: '⚙️',
    status: 'connected',
    description: 'Background jobs & event-driven workflows',
    lastSync: 'Active',
    category: 'Infrastructure'
  },
  {
    id: 'posthog',
    name: 'PostHog',
    emoji: '📊',
    status: 'connected',
    description: 'Product analytics & feature flags',
    lastSync: 'Real-time',
    category: 'Infrastructure'
  },
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '/icons/shopify.svg',
    emoji: '🛍️',
    status: 'connected',
    description: 'Syncs orders & inventory in real-time',
    lastSync: '2 minutes ago',
    category: 'E-commerce'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: '/icons/woocommerce.svg',
    emoji: '🛒',
    status: 'disconnected',
    description: 'WordPress e-commerce integration',
    category: 'E-commerce'
  },
  {
    id: 'amazon',
    name: 'Amazon FBA',
    icon: '/icons/amazon.svg',
    emoji: '📦',
    status: 'disconnected',
    description: 'Imports FBA orders and fees',
    category: 'Marketplace'
  },
  {
    id: 'qbo',
    name: 'QuickBooks',
    icon: '/icons/quickbooks.svg',
    emoji: '📚',
    status: 'disconnected',
    description: 'Automates invoices and taxes',
    category: 'Accounting'
  },
  {
    id: 'xero',
    name: 'Xero',
    icon: '/icons/xero.svg',
    emoji: '💼',
    status: 'disconnected',
    description: 'Cloud accounting platform',
    category: 'Accounting'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '/icons/slack.svg',
    emoji: '💬',
    status: 'connected',
    description: 'Low stock alerts to #inventory',
    lastSync: 'Real-time',
    category: 'Communication'
  },
  {
    id: 'shipstation',
    name: 'ShipStation',
    icon: '/icons/shipstation.svg',
    emoji: '🚚',
    status: 'disconnected',
    description: 'Shipping automation & labels',
    category: 'Shipping'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '/icons/stripe.svg',
    emoji: '💳',
    status: 'connected',
    description: 'Payment processing & billing',
    lastSync: 'Real-time',
    category: 'Payments'
  },
];

/**
 * Integrations page - Shows available app integrations
 * Demonstrates "plug-and-play" connectivity capabilities
 */
const Integrations = () => {
  const [connecting, setConnecting] = useState(null);

  const handleConnect = async (app) => {
    setConnecting(app.id);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    setConnecting(null);
    toast.success(`${app.name} integration initiated`, {
      description: 'OAuth flow would open in production'
    });
  };

  const handleSync = (app) => {
    toast.success(`Syncing ${app.name}...`, {
      description: 'Data sync initiated'
    });
  };

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length;

  // Group integrations by category
  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">App Integrations</h2>
          <p className="text-sm text-slate-500 mt-1">
            {connectedCount} of {INTEGRATIONS.length} apps connected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            View API Docs
          </button>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{connectedCount}</p>
              <p className="text-xs text-emerald-600">Active Connections</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">1,234</p>
              <p className="text-xs text-slate-500">Syncs Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">99.9%</p>
              <p className="text-xs text-slate-500">Uptime</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrations by Category */}
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.filter(app => app.category === category).map(app => (
              <Card
                key={app.id}
                className={`p-5 flex items-start justify-between group transition-all ${
                  app.status === 'connected'
                    ? 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30'
                    : 'hover:border-indigo-200'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {app.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{app.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{app.description}</p>
                    {app.lastSync && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Last sync: {app.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {app.status === 'connected' ? (
                    <>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                        <Check className="w-3 h-3" /> Connected
                      </button>
                      <button
                        onClick={() => handleSync(app)}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Sync
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(app)}
                      disabled={connecting === app.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors disabled:opacity-50"
                    >
                      {connecting === app.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Integration CTA */}
      <Card className="p-6 border-dashed border-2 border-slate-200 bg-slate-50/50">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔧</span>
          </div>
          <h3 className="font-bold text-slate-900">Need a Custom Integration?</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Use our REST API or webhooks to build custom integrations with any system.
          </p>
          <button className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors">
            View API Documentation
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Integrations;
