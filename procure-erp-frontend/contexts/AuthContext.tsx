'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, refreshToken, logout as apiLogout } from '@/lib/api/auth';

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        } else {
          const refreshTokenValue = localStorage.getItem('refreshToken');
          if (refreshTokenValue) {
            const result = await refreshToken(refreshTokenValue);
            if (result.success && result.user) {
              setUser(result.user);
              localStorage.setItem('user', JSON.stringify(result.user));
              if (result.accessToken) {
                localStorage.setItem('accessToken', result.accessToken);
              }
              if (result.refreshToken) {
                localStorage.setItem('refreshToken', result.refreshToken);
              }
            } else {
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const handleLogin = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiLogin(username, password, rememberMe);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('ログインエラー:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiLogout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
