// procure-erp-frontend/stores/useAuth.ts
"use client";

import { useState } from 'react';
import { useAuthStore, User } from "./authStore";
import { authApi } from "@/lib/api/auth";          // ← 既存の API ラッパー
import { mfaApi } from "@/lib/api/mfa";            // ← 追加: MFA API ラッパー
import { clearMfaToken } from "@/lib/api/axios";   // ← 追加: MFAトークンクリア関数

/** 画面から見える型の拡張 */
export interface UseAuthReturn {
  /** 画面用ラッパー – 成功すれば true */
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; requireMfa?: boolean }>;
  verifyMfa: (token: string) => Promise<boolean>;
  verifyRecoveryCode: (code: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
}

export const useAuth = (): UseAuthReturn => {
  /** store の setter／state を個別に取得 */
  const setLoading = useAuthStore((s) => s.setLoading);
  const writeLogin = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [mfaRequired, setMfaRequired] = useState(false);

  /** 画面用ラッパー - MFA対応の拡張 */
  const login = async (username: string, password: string, rememberMe: boolean): Promise<{ success: boolean; requireMfa?: boolean }> => {
    try {
      setLoading(true);
      const res = await authApi.login(username, password, rememberMe);

      if (res.user && res.accessToken) {
        // 引数を2つだけに修正（refreshTokenを除外）
        writeLogin(res.user, res.accessToken);
        
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
   * ログアウト - MFAトークンもクリア
   */
  const handleLogout = () => {
    // MFAトークンのクリア
    clearMfaToken();
    setMfaRequired(false);
    
    // 標準のログアウト処理
    logout();
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