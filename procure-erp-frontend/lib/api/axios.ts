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
    
    // 非GETリクエストの場合のみCSRFトークンを設定
    if (config.method !== 'get') {
      try {
        // CSRFマネージャーからトークンを取得
        const token = await csrfManager.getToken();
        
        if (token) {
          config.headers['X-CSRF-Token'] = token;
        } else {
          console.warn('CSRFトークンが設定できませんでした');
        }
      } catch (error) {
        console.error('CSRFトークン取得エラー:', error);
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
        console.error("トークンリフレッシュエラー:", refreshError);
        
        // 認証関連の情報をクリア
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        
        // 認証関連の問題の場合はログインページにリダイレクト
        if (typeof window !== "undefined") {
          window.location.href = "/login";
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
        console.error("CSRF再取得エラー:", csrfError);
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
  csrfManager.getToken().catch(console.error);
}

// エクスポート
export { csrfManager };