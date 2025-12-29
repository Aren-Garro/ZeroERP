import { Auth0Provider as Auth0ProviderLib } from '@auth0/auth0-react';

/**
 * Auth0 Provider wrapper component
 * Wraps the application with Auth0 authentication context
 */
const Auth0Provider = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = window.location.origin;

  if (!domain || !clientId) {
    console.warn('Auth0 configuration missing. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables.');
  }

  return (
    <Auth0ProviderLib
      domain={domain || 'placeholder.auth0.com'}
      clientId={clientId || 'placeholder'}
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
