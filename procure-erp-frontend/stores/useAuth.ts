// procure-erp-frontend/stores/useAuth.ts
"use client";

import { useEffect } from 'react';
import { useAuthStore, User } from "./authStore";
import { authApi } from "@/lib/api/auth";
import { mfaApi } from "@/lib/api/mfa";
import { clearMfaToken } from "@/lib/api/axios";

/** 認証フックが提供するインターフェース */
export interface UseAuthReturn {
  // ログイン処理 - MFA対応
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; requireMfa?: boolean }>;
  // MFA検証
  verifyMfa: (token: string) => Promise<boolean>;
  verifyRecoveryCode: (code: string) => Promise<boolean>;
  // ログアウト
  logout: () => void;
  // 状態
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
}

/**
 * 認証機能を提供するカスタムフック - Cookie認証に統一
 * アプリケーション内で認証関連の処理を行う場合は、必ずこのフックを使用してください。
 */
export const useAuth = (): UseAuthReturn => {
  // 内部ストアからステートとアクションを取得
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setMfaRequired = useAuthStore((s) => s.setMfaRequired);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const mfaRequired = useAuthStore((s) => s.mfaRequired);

  /**
   * アプリ初期化時に認証状態を確認
   * このフックが最初に使用されたときに一度だけ実行される
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // APIを呼び出して現在の認証状態を取得
        const isAuthenticated = await authApi.checkAuth();
        
        if (isAuthenticated) {
          const userData = await authApi.getProfile();
          if (userData) {
            setUser(userData);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('認証初期化エラー:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * ログイン処理 - API呼び出しと状態更新
   * HTTPOnly Cookie認証に統一
   */
  const login = async (username: string, password: string, rememberMe: boolean): Promise<{ success: boolean; requireMfa?: boolean }> => {
    try {
      setLoading(true);
      const res = await authApi.login(username, password, rememberMe);

      if (res.user) {
        // 認証情報を保存 (アクセストークンはCookieのみで管理)
        setUser(res.user);
        
        // MFAが必要かチェック
        if (process.env.NODE_ENV !== 'production') {
          console.log('MFA要求状態チェック:', res.requireMfa);
        }
        if (res.requireMfa) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('MFA認証が必要です - 状態をセット');
          }
          setMfaRequired(true);
          return { success: true, requireMfa: true };
        }
        
        return { success: true, requireMfa: false };
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * MFAトークンの検証
   */
  const verifyMfa = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const res = await mfaApi.verifyMfa(token);
      
      if (res.verified && res.mfaToken) {
        // MFAトークンをsessionStorageに保存（ブラウザを閉じると消える）
        sessionStorage.setItem("mfaToken", res.mfaToken);
        setMfaRequired(false);
        return true;
      }
      
      return false;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('MFA検証エラー:', error);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * リカバリーコードの検証
   */
  const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const res = await mfaApi.verifyRecoveryCode(code);
      
      if (res.verified && res.mfaToken) {
        // MFAトークンをsessionStorageに保存（ブラウザを閉じると消える）
        sessionStorage.setItem("mfaToken", res.mfaToken);
        setMfaRequired(false);
        return true;
      }
      
      return false;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('リカバリーコード検証エラー:', error);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * ログアウト処理 - 状態クリアとAPI呼び出し
   * Cookie認証に統一
   */
  const handleLogout = () => {
    // MFAトークンのクリア
    clearMfaToken();
    setMfaRequired(false);
    
    // ログアウトAPIの呼び出し (サーバー側でCookieを削除)
    authApi.logout().catch(err => {
      console.error('ログアウトAPIエラー:', err);
    });
    
    // 状態をクリア
    setUser(null);
  };

  return { 
    login, 
    logout: handleLogout, 
    verifyMfa,
    verifyRecoveryCode,
    user, 
    loading,
    mfaRequired
  };
};