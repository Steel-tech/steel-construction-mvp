import React, { useEffect, useState } from 'react';
import { apiService, type User } from '../../services/api.service';
import { AuthContext } from './AuthContextBase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = apiService.getToken();
      if (token) {
        // Token exists, but we need to verify it's still valid
        // For now, we'll assume it's valid if it exists
        // In a production app, you might want to validate the token with the server
        try {
          // Basic JWT token parsing to get user info (without verification)
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.userId,
            email: payload.email || '',
            full_name: payload.full_name || '',
            role: payload.role || 'client',
            created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString()
          });
        } catch (error) {
          console.error('Invalid token format:', error);
          apiService.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role = 'client') => {
    setLoading(true);
    try {
      const response = await apiService.register({
        email,
        password,
        name: fullName,
        role,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.login({ email, password });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile: user, // alias for existing pages
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
