import { useState } from 'react';
import { Copy, Plus, Trash2, Key, Globe, Check, ExternalLink, Code, Zap } from 'lucide-react';
import { Card } from '../components/ui';
import { toast } from 'sonner';

/**
 * Developers page - API Keys and Webhooks management
 * Enables developers and power users to build on top of ZeroERP
 */
const Developers = () => {
  // Mock state for demo - in production this comes from backend
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Zapier Integration', prefix: 'pk_live_x8k2m...', created: '2023-12-01', lastUsed: '2 hours ago' },
    { id: '2', name: 'Warehouse Scanner', prefix: 'pk_live_9n3jq...', created: '2024-01-15', lastUsed: '5 minutes ago' }
  ]);

  const [webhooks, setWebhooks] = useState([
    { id: '1', url: 'https://hooks.zapier.com/hooks/catch/123456', events: ['order.created', 'order.shipped'], status: 'active' },
    { id: '2', url: 'https://api.slack.com/webhooks/T123/B456', events: ['inventory.low'], status: 'active' }
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateApiKey = () => {
    const fullKey = `pk_live_${crypto.randomUUID().replace(/-/g, '').substring(0, 32)}`;
    const newKey = {
      id: Date.now().toString(),
      name: newKeyName || 'New API Key',
      prefix: `${fullKey.substring(0, 12)}...`,
      fullKey,
      created: new Date().toLocaleDateString(),
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newKey]);
    setGeneratedKey(fullKey);
    setNewKeyName('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteApiKey = (id) => {
    setApiKeys(keys => keys.filter(k => k.id !== id));
    toast.success('API key revoked');
  };

  const deleteWebhook = (id) => {
    setWebhooks(hooks => hooks.filter(h => h.id !== id));
    toast.success('Webhook endpoint removed');
  };

  const AVAILABLE_EVENTS = [
    { id: 'order.created', label: 'Order Created', description: 'Fires when a new order is placed' },
    { id: 'order.shipped', label: 'Order Shipped', description: 'Fires when an order is marked as shipped' },
    { id: 'order.cancelled', label: 'Order Cancelled', description: 'Fires when an order is cancelled' },
    { id: 'inventory.low', label: 'Low Stock Alert', description: 'Fires when stock drops below safety level' },
    { id: 'inventory.updated', label: 'Inventory Updated', description: 'Fires when stock levels change' },
    { id: 'po.created', label: 'PO Created', description: 'Fires when a purchase order is created' },
    { id: 'po.received', label: 'PO Received', description: 'Fires when a purchase order is received' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Developer Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage API keys and webhook endpoints for integrations.</p>
        </div>
        <button className="text-indigo-600 font-medium text-sm hover:underline flex items-center gap-1">
          <ExternalLink className="w-3.5 h-3.5" />
          View API Documentation
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{apiKeys.length}</p>
              <p className="text-xs text-indigo-600">Active API Keys</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-white border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-700">{webhooks.length}</p>
              <p className="text-xs text-pink-600">Webhook Endpoints</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">2,451</p>
              <p className="text-xs text-slate-500">API Calls (24h)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Keys Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" /> API Keys
            </h3>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Generate New
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-slate-300 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 text-sm">{key.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-slate-500 font-mono">{key.prefix}</code>
                    <span className="text-[10px] text-slate-400">Last used: {key.lastUsed}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(key.prefix)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Copy key prefix"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {apiKeys.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No API keys yet</p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>Security:</strong> API keys grant full access to your account. Never share them publicly or commit them to version control.
            </p>
          </div>
        </Card>

        {/* Webhooks Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-600" /> Webhooks
            </h3>
            <button className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Endpoint
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.map(hook => (
              <div key={hook.id} className="p-4 border border-slate-200 rounded-lg group hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] text-green-600 font-medium uppercase">Active</span>
                    </div>
                    <p className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded mt-2 truncate">
                      {hook.url}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWebhook(hook.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hook.events.map(event => (
                    <span key={event} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {webhooks.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No webhooks configured</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Available Events Reference */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">Available Webhook Events</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_EVENTS.map(event => (
            <div key={event.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {event.id}
              </code>
              <p className="text-sm font-medium text-slate-800 mt-2">{event.label}</p>
              <p className="text-xs text-slate-500 mt-1">{event.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Code Example */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" /> Quick Start
          </h3>
          <button
            onClick={() => copyToClipboard(`curl -X GET https://api.zeroerp.com/v1/inventory \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
{`curl -X GET https://api.zeroerp.com/v1/inventory \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response
{
  "data": [
    { "id": "sku_001", "name": "Widget", "stock": 150 },
    { "id": "sku_002", "name": "Gadget", "stock": 42 }
  ],
  "meta": { "total": 2, "page": 1 }
}`}
        </pre>
      </Card>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            {!generatedKey ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Generate API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Warehouse Integration"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setShowNewKeyModal(false); setNewKeyName(''); }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateApiKey}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">API Key Generated</h3>
                  <p className="text-sm text-slate-500 mt-1">Make sure to copy it now. You won't be able to see it again.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                  <code className="text-xs font-mono text-slate-800 break-all">{generatedKey}</code>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Key'}
                  </button>
                  <button
                    onClick={() => { setShowNewKeyModal(false); setGeneratedKey(null); }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Developers;
