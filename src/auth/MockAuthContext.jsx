import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Mock Auth Context for development/demo mode
 * Provides the same interface as Auth0 but works without Auth0 credentials
 */
const MockAuthContext = createContext(null);

/**
 * Demo user for mock authentication
 */
const DEMO_USER = {
  sub: 'demo|123456789',
  name: 'Demo User',
  email: 'demo@zeroerp.local',
  picture: null,
  email_verified: true,
  'https://zeroerp.com/roles': ['Admin'],
};

/**
 * Mock Auth Provider component
 * Simulates Auth0 authentication for development without credentials
 */
export const MockAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const loginWithRedirect = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setUser(DEMO_USER);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async (options = {}) => {
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const getAccessTokenSilently = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    // Return a mock token
    return 'mock-access-token-for-demo';
  }, [isAuthenticated]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Hook to access mock auth context
 */
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export default MockAuthContext;
