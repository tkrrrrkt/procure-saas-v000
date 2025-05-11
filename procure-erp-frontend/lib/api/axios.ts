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

// リクエストインターセプター - 強化版
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
    
    // CSRFトークン設定 - すべてのリクエスト(GET含む)に対応し、一部エンドポイントを除外
    // GET以外のリクエストと、一部のGETリクエスト（データ取得だが特権操作）はCSRFトークンを設定
    const isCsrfRequired = 
      config.method !== 'get' || 
      // 特権操作を含むGETリクエスト
      (config.url?.includes('/auth/mfa/setup')) ||
      (config.url?.includes('/auth/mfa/status'));
      
    if (isCsrfRequired && config.url !== '/csrf/token') { // CSRF取得リクエスト自体には不要
      try {
        // 最大3回の再試行
        let token = null;
        let retryCount = 0;
        
        while (!token && retryCount < 3) {
          // CSRFマネージャーからトークンを取得
          token = await csrfManager.getToken();
          
          if (!token) {
            retryCount++;
            if (retryCount < 3) {
              console.warn(`CSRFトークン取得再試行 (${retryCount}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms待機
              // トークンの強制再取得
              await csrfManager.refreshToken();
            }
          }
        }
        
        if (token) {
          config.headers['X-CSRF-Token'] = token;
          
          // デバッグ用ログ（開発環境のみ）
          if (process.env.NODE_ENV !== 'production' && config.method !== 'get') {
            console.log(`CSRFトークンをヘッダーに設定: ${config.method?.toUpperCase()} ${config.url}, Token: ${token.substring(0, 8)}...`);
          }
        } else {
          console.warn(`CSRFトークンが設定できませんでした: ${config.method?.toUpperCase()} ${config.url}`, csrfManager.getDebugInfo());
          
          // 最終手段：Cookieから直接取得を試みる
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'csrf_token' && value) {
                console.log('直接Cookieから緊急取得したCSRFトークンを使用:', value.substring(0, 8) + '...');
                config.headers['X-CSRF-Token'] = value;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('CSRFトークン取得エラー:', error);
        
        // エラーが発生したときのフォールバック
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf_token' && value) {
              console.log('エラー後にCookieから緊急取得したCSRFトークンを使用:', value.substring(0, 8) + '...');
              config.headers['X-CSRF-Token'] = value;
              break;
            }
          }
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

// アプリ起動時にCSRFトークンを取得 - 強化版
if (typeof window !== 'undefined') {
  // 初期ロード時だけでなく、トークンが確実に取得できるよう複数回試行
  const initCsrfToken = async () => {
    console.log('アプリ起動時のCSRFトークン初期化を開始...');
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const token = await csrfManager.getToken();
        if (token) {
          console.log(`アプリ起動時のCSRFトークン初期化成功 (試行: ${retryCount + 1}/${maxRetries})`);
          return;
        }
        
        console.warn(`アプリ起動時のCSRFトークン取得失敗 (試行: ${retryCount + 1}/${maxRetries})`);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`${500 * retryCount}ms待機後に再試行します...`);
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      } catch (error) {
        console.error(`アプリ起動時のCSRFトークン取得エラー (試行: ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`${500 * retryCount}ms待機後に再試行します...`);
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
    }
    
    console.error(`アプリ起動時のCSRFトークン初期化に${maxRetries}回失敗しました。ページの再読み込みをお試しください。`);
  };
  
  // ページロード完了後に初期化を実行（リソース読み込み優先）
  if (document.readyState === 'complete') {
    initCsrfToken();
  } else {
    window.addEventListener('load', initCsrfToken);
  }
  
  // さらに、フォーカス再取得時（他のページから戻った場合など）にもトークンを更新
  window.addEventListener('focus', () => {
    csrfManager.refreshToken().catch(error => {
      console.error('フォーカス時のCSRFトークン更新エラー:', error);
    });
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