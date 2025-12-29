import { useAuth0 } from '@auth0/auth0-react';

/**
 * Custom hook for authentication state and actions
 * Wraps Auth0 hook with convenient helpers
 */
export const useAuth = () => {
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

  /**
   * Get user initials for avatar display
   */
  const getUserInitials = () => {
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
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.name || user.email || 'User';
  };

  /**
   * Get user role (from Auth0 metadata or default)
   */
  const getUserRole = () => {
    if (!user) return '';
    // Check for custom claims in user object
    const roles = user['https://zeroerp.com/roles'] || [];
    if (roles.length > 0) return roles[0];
    return 'User';
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
    getUserInitials,
    getUserDisplayName,
    getUserRole,
  };
};
