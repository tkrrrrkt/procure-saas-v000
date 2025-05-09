'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';

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
        // まず、サーバーサイドのセッション/クッキーベースの認証をチェック
        const isAuthenticated = await authApi.checkAuth();
        
        if (isAuthenticated) {
          // 認証済みならプロファイル情報を取得
          const profileData = await authApi.getProfile();
          if (profileData) {
            setUser(profileData);
            // ローカルストレージも更新して後方互換性を維持
            localStorage.setItem('user', JSON.stringify(profileData));
            return;
          }
        }
        
        // Cookieベース認証に失敗した場合、レガシーフローを試行
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
          return;
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // リフレッシュトークンによる再認証
          const result = await authApi.refreshToken(refreshToken);
          if (result.user) {
            persistAuth(result);
            return;
          }
        }

        clearAuthData(); // 全ての認証フロー失敗時
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
    
    // アクセストークンとリフレッシュトークンはCookieにも保存されるが、
    // 後方互換性のためにローカルストレージにも保存
    if (res.accessToken) localStorage.setItem('accessToken', res.accessToken);
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
      // ログアウトAPIを呼び出し（サーバー側でトークンを無効化し、Cookieを削除）
      await authApi.logout();
    } catch (err) {
      console.error('ログアウトエラー:', err);
    } finally {
      // ローカルストレージのデータも削除
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