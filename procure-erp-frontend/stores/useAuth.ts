// procure-erp-frontend/stores/useAuth.ts
"use client";

import { useState } from 'react';
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
 * 認証機能を提供するカスタムフック
 * アプリケーション内で認証関連の処理を行う場合は、必ずこのフックを使用してください。
 * 内部的にはZustandのuseAuthStoreを使用していますが、直接useAuthStoreを使用せず、
 * このフックを通じてアクセスすることで、認証ロジックの一元管理を実現します。
 */
export const useAuth = (): UseAuthReturn => {
  // 内部ストアからステートとアクションを取得
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [mfaRequired, setMfaRequired] = useState(false);

  /**
   * ログイン処理 - API呼び出しと状態更新
   */
  const login = async (username: string, password: string, rememberMe: boolean): Promise<{ success: boolean; requireMfa?: boolean }> => {
    try {
      setLoading(true);
      const res = await authApi.login(username, password, rememberMe);

      if (res.user && res.accessToken) {
        // 認証情報を保存
        setUser(res.user, res.accessToken);
        
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
   */
  const handleLogout = () => {
    // MFAトークンのクリア
    clearMfaToken();
    setMfaRequired(false);
    
    // ログアウトAPIの呼び出し
    authApi.logout().catch(err => {
      console.error('ログアウトAPIエラー:', err);
    });
    
    // 状態をクリア
    setUser(null, null);
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