'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';          // ← 変更

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

  /* 初期化 ------------------------------------------------------------- */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser    = localStorage.getItem('user');
        const accessToken   = localStorage.getItem('accessToken');

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
          return;
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const result = await authApi.refreshToken(refreshToken);
          if (result.user) {
            persistAuth(result);
            return;
          }
        }

        clearAuthData(); // 失敗時
      } catch (err) {
        console.error('認証初期化エラー:', err);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* ヘルパ ------------------------------------------------------------- */
  const persistAuth = (res: { user: User; accessToken: string | null; refreshToken: string | null }) => {
    setUser(res.user);
    localStorage.setItem('user', JSON.stringify(res.user));
    if (res.accessToken)  localStorage.setItem('accessToken',  res.accessToken);
    if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
  };

  const clearAuthData = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  /* ログイン ----------------------------------------------------------- */
  const handleLogin = async (
    username: string,
    password: string,
    rememberMe: boolean
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await authApi.login(username, password, rememberMe);

      if (res.user) {
        persistAuth(res);
        return true;
      }
      return false;
    } catch (err) {
      console.error('ログインエラー:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ログアウト --------------------------------------------------------- */
  const handleLogout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (err) {
      console.error('ログアウトエラー:', err);
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------- */
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
