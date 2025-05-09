// src/lib/api/axios.ts

import axios from "axios";
import { ApiResponse } from "../types/api";
import { csrfManager } from "./csrf-manager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // クッキーを送受信するために必要
});

// リクエストインターセプター
axiosInstance.interceptors.request.use(
  async (config) => {
    // 後方互換性のため、localStorage からもトークンを取得
    // HttpOnly Cookie が優先されるが、古いコードとの互換性のため維持
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // MFAトークンがあれば、リクエストヘッダーに追加（セキュリティのためsessionStorageのみを使用）
    const mfaToken = sessionStorage.getItem("mfaToken");
    if (mfaToken) {
      config.headers['X-MFA-Token'] = mfaToken;
      // 本番環境ではログを削除するか、最低限の情報のみ出力
      if (process.env.NODE_ENV !== 'production') {
        console.log('MFAトークンをヘッダーに追加:', mfaToken.substring(0, 6) + '***');
      }
    }
    
    // 非GETリクエストの場合のみCSRFトークンを設定
    if (config.method !== 'get') {
      try {
        // CSRFマネージャーからトークンを取得
        const token = await csrfManager.getToken();
        
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('CSRFトークンが設定できませんでした');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('CSRFトークン取得エラー:', error);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401エラー（認証切れ）の処理
    if (error.response?.status === 401 && !originalRequest._retry) {
      // MFA要求エラーの処理
      if (error.response?.data?.error?.code === 'MFA_REQUIRED' && !originalRequest._mfaRetry) {
        originalRequest._mfaRetry = true;
        
        // MFA認証が必要なことをイベント通知
        if (typeof window !== 'undefined') {
          const mfaRequiredEvent = new CustomEvent('mfa-required', {
            detail: {
              originalRequest,
            }
          });
          window.dispatchEvent(mfaRequiredEvent);
        }
        
        // MFA認証が必要な場合は、元のリクエストは中断
        return Promise.reject(error);
      }
      
      // 通常の認証エラー処理（トークンリフレッシュ）
      originalRequest._retry = true;
      
      try {
        // リフレッシュトークンはCookieから自動送信されるので、リクエストボディは空でOK
        const response = await axios.post<ApiResponse<{accessToken: string}>>(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true // クッキーを送受信するために必要
        });
        
        if (response.data.status === 'success' && response.data.data) {
          // 後方互換性のため、アクセストークンをローカルストレージにも保存
          if (response.data.data.accessToken) {
            localStorage.setItem("accessToken", response.data.data.accessToken);
            // リクエストヘッダーを更新
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          }
          
          // 新しいトークンはCookieに自動保存されているので、
          // 単にリクエストを再試行するだけでOK
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error("トークンリフレッシュエラー:", refreshError);
        }
        
        // 認証関連の情報をクリア
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        // MFAトークンはsessionStorageからのみクリア
        sessionStorage.removeItem("mfaToken");
        if (process.env.NODE_ENV !== 'production') {
          console.log('認証エラーにより認証情報をクリアしました');
        }
        
        // 認証関連の問題の場合はログインページにリダイレクト
        if (typeof window !== "undefined") {
          // MFA認証が必要な場合は専用ページにリダイレクト
          if (error.response?.data?.error?.code === 'MFA_REQUIRED') {
            window.location.href = "/login?mfa=required";
          } else {
            // その他の認証エラーは通常のログインページへ
            window.location.href = "/login";
          }
        }
      }
    }
    
    // 403エラー（CSRF検証失敗）の処理
    if (error.response?.status === 403 && 
        error.response?.data?.error?.code === 'CSRF_TOKEN_INVALID' &&
        !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      
      try {
        // CSRFトークンを再取得
        const token = await csrfManager.refreshToken();
        
        if (token) {
          // 再取得したトークンでリクエストを再試行
          originalRequest.headers['X-CSRF-Token'] = token;
          return axiosInstance(originalRequest);
        }
      } catch (csrfError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error("CSRF再取得エラー:", csrfError);
        }
      }
    }
    
    // エラーレスポンスの標準化
    if (error.response?.data) {
      // すでに標準形式の場合
      if (error.response.data.status === 'error') {
        return Promise.reject(error);
      }
      
      // 標準形式でない場合は変換
      const standardError = {
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            error: {
              code: error.response.data.code || `HTTP_${error.response.status}`,
              message: error.response.data.message || '予期せぬエラーが発生しました',
              details: error.response.data.details,
            }
          }
        }
      };
      
      return Promise.reject(standardError);
    }
    
    // ネットワークエラーなど
    return Promise.reject({
      ...error,
      response: {
        data: {
          status: 'error',
          error: {
            code: 'NETWORK_ERROR',
            message: 'サーバーに接続できませんでした',
          }
        }
      }
    });
  }
);

// アプリ起動時にCSRFトークンを取得
if (typeof window !== 'undefined') {
  csrfManager.getToken().catch(error => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('アプリ起動時のCSRFトークン取得エラー:', error);
    }
  });
}

/**
 * MFAトークンをクリアする
 * ログアウト時などに呼び出し
 */
export const clearMfaToken = () => {
  if (typeof window !== 'undefined') {
    // MFAトークンはsessionStorageでのみ管理する
    sessionStorage.removeItem('mfaToken');
    // 本番環境ではログを削除または最小限に
    if (process.env.NODE_ENV !== 'production') {
      console.log('MFAトークンをクリアしました');
    }
  }
};

// エクスポート
export { csrfManager };