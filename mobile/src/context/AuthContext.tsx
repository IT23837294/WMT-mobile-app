import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { clearToken, loadToken, saveToken } from '@/src/lib/storage';
import { ApiError, request } from '@/src/lib/api';
import type { AuthResult, User, UserRole } from '@/src/types';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  errorMessage: string | null;
  login: (email: string, password: string, preferredRole?: UserRole) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: Partial<Pick<User, 'name' | 'phone' | 'address'>>) => Promise<{ success: boolean; message?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hydrateSession = async () => {
    try {
      const storedToken = await loadToken();

      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);
      const response = await request<{ success: boolean; user: User }>('/auth/me', {
        method: 'GET',
        token: storedToken
      });

      setUser(response.user);
      setErrorMessage(null);
    } catch (error) {
      setUser(null);
      setToken(null);
      await clearToken();
      setErrorMessage(getMessage(error, 'Unable to restore session'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateSession();
  }, []);

  const persistAuth = async (authResult: AuthResult) => {
    setToken(authResult.token);
    setUser(authResult.user);
    setErrorMessage(null);
    await saveToken(authResult.token);
  };

  const login = async (email: string, password: string, preferredRole?: UserRole) => {
    try {
      const response = await request<AuthResult>('/auth/login', {
        method: 'POST',
        body: {
          email,
          password,
          preferredRole
        }
      });

      await persistAuth(response);
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Login failed');
      setErrorMessage(message);
      return { success: false, message };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await request<AuthResult>('/auth/register', {
        method: 'POST',
        body: payload
      });

      await persistAuth(response);
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Registration failed');
      setErrorMessage(message);
      return { success: false, message };
    }
  };

  const refreshUser = async () => {
    if (!token) {
      return;
    }

    const response = await request<{ success: boolean; user: User }>('/auth/me', {
      method: 'GET',
      token
    });

    setUser(response.user);
  };

  const updateProfile = async (payload: Partial<Pick<User, 'name' | 'phone' | 'address'>>) => {
    if (!token) {
      return { success: false, message: 'Please sign in again' };
    }

    try {
      const response = await request<{ success: boolean; user: User }>('/auth/profile', {
        method: 'PUT',
        token,
        body: payload
      });

      setUser(response.user);
      return { success: true };
    } catch (error) {
      const message = getMessage(error, 'Profile update failed');
      return { success: false, message };
    }
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
    setToken(null);
    setErrorMessage(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      errorMessage,
      login,
      register,
      logout,
      refreshUser,
      updateProfile
    }),
    [user, token, loading, errorMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
