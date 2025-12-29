import { createContext } from 'react';
import { Auth0Provider as Auth0ProviderLib } from '@auth0/auth0-react';
import { MockAuthProvider } from './MockAuthContext';

/**
 * Context to track whether we're in mock auth mode
 */
export const AuthModeContext = createContext({ isMockAuth: false });

/**
 * Check if Auth0 credentials are properly configured
 */
const checkAuth0Config = () => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  return domain && clientId &&
    domain !== 'placeholder' &&
    domain !== 'your-tenant.auth0.com' &&
    clientId !== 'placeholder' &&
    clientId !== 'your_client_id_here';
};

/**
 * Auth0 Provider wrapper component
 * Wraps the application with Auth0 authentication context
 * Falls back to mock authentication for development when Auth0 is not configured
 */
const Auth0Provider = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  const isConfigured = checkAuth0Config();

  // Use mock auth when Auth0 is not configured (demo/development mode)
  if (!isConfigured) {
    console.info('Auth0 not configured - running in demo mode with mock authentication.');
    return (
      <AuthModeContext.Provider value={{ isMockAuth: true }}>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </AuthModeContext.Provider>
    );
  }

  return (
    <AuthModeContext.Provider value={{ isMockAuth: false }}>
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
    </AuthModeContext.Provider>
  );
};

export default Auth0Provider;
