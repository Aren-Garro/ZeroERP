import { Auth0Provider as Auth0ProviderLib } from '@auth0/auth0-react';
import { Package, AlertTriangle } from 'lucide-react';

/**
 * Configuration error component shown when Auth0 credentials are missing
 */
const Auth0ConfigError = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex flex-col">
    <header className="p-6">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-200">
          <Package className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">ZeroERP</span>
      </div>
    </header>
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-9 h-9 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Auth0 Configuration Required</h1>
            <p className="text-slate-600">
              Authentication is not configured. Please set up Auth0 credentials to enable login.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm font-mono text-slate-700">
            <p className="mb-2">Required environment variables:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• VITE_AUTH0_DOMAIN</li>
              <li>• VITE_AUTH0_CLIENT_ID</li>
            </ul>
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">
            See .env.example for configuration details
          </p>
        </div>
      </div>
    </main>
    <footer className="p-6 text-center text-sm text-slate-500">
      <p>&copy; 2024 ZeroERP. All rights reserved.</p>
    </footer>
  </div>
);

/**
 * Auth0 Provider wrapper component
 * Wraps the application with Auth0 authentication context
 */
const Auth0Provider = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  // Check if Auth0 credentials are properly configured
  const isConfigured = domain && clientId &&
    domain !== 'placeholder' &&
    domain !== 'your-tenant.auth0.com' &&
    clientId !== 'placeholder' &&
    clientId !== 'your_client_id_here';

  if (!isConfigured) {
    console.warn('Auth0 configuration missing or using placeholder values. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables.');
    return <Auth0ConfigError />;
  }

  return (
    <Auth0ProviderLib
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderLib>
  );
};

export default Auth0Provider;
