import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  refreshTokens,
  initializeAuth,
  setAuthHeader,
  clearStoredTokens,
} from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          await refreshTokens();
          const userData = await getCurrentUser();
          setUser(userData);
          return userData;
        } catch {
          clearStoredTokens();
          setAuthHeader(null);
          setUser(null);
        }
      } else {
        clearStoredTokens();
        setAuthHeader(null);
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const hasToken = initializeAuth();
      if (hasToken) {
        await loadUser();
      }
      setLoading(false);
    }
    initAuth();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      let message = 'Login failed';
      if (err.response?.data?.details && err.response.data.details.length > 0) {
        message = err.response.data.details.map(d => d.message).join('. ');
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setError(null);
    try {
      const data = await apiRegister(email, password, name);
      setUser(data.user);
      return data;
    } catch (err) {
      let message = 'Registration failed';
      if (err.response?.data?.details && err.response.data.details.length > 0) {
        message = err.response.data.details.map(d => d.message).join('. ');
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loadUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
