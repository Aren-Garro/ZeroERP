import { useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthModeContext } from '../auth/Auth0Provider';
import { useMockAuth } from '../auth/MockAuthContext';

/**
 * Custom hook for authentication state and actions
 * Supports both Auth0 and mock authentication modes
 */
export const useAuth = () => {
  const { isMockAuth } = useContext(AuthModeContext);

  // Use the appropriate auth hook based on mode
  if (isMockAuth) {
    return useMockAuthHook();
  }
  return useAuth0Hook();
};

/**
 * Auth0 implementation of useAuth
 */
const useAuth0Hook = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    error,
  } = useAuth0();

  /**
   * Login with redirect to Auth0
   */
  const login = (options = {}) => {
    return loginWithRedirect(options);
  };

  /**
   * Signup with redirect to Auth0 (opens signup screen)
   */
  const signup = () => {
    return loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  };

  /**
   * Logout and redirect to home
   */
  const logout = () => {
    return auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    signup,
    logout,
    getAccessTokenSilently,
    ...getUserHelpers(user),
  };
};

/**
 * Mock auth implementation of useAuth
 */
const useMockAuthHook = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: mockLogout,
    getAccessTokenSilently,
    error,
  } = useMockAuth();

  /**
   * Login with mock authentication
   */
  const login = (options = {}) => {
    return loginWithRedirect(options);
  };

  /**
   * Signup (same as login in mock mode)
   */
  const signup = () => {
    return loginWithRedirect();
  };

  /**
   * Logout from mock session
   */
  const logout = () => {
    return mockLogout();
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    signup,
    logout,
    getAccessTokenSilently,
    ...getUserHelpers(user),
  };
};

/**
 * Shared user helper functions
 */
const getUserHelpers = (user) => ({
  /**
   * Get user initials for avatar display
   */
  getUserInitials: () => {
    if (!user) return '??';

    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return '??';
  },

  /**
   * Get user display name
   */
  getUserDisplayName: () => {
    if (!user) return 'Guest';
    return user.name || user.email || 'User';
  },

  /**
   * Get user role (from Auth0 metadata or default)
   */
  getUserRole: () => {
    if (!user) return '';
    // Check for custom claims in user object
    const roles = user['https://zeroerp.com/roles'] || [];
    if (roles.length > 0) return roles[0];
    return 'User';
  },
});
