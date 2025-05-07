// src/lib/api/axios.ts

import axios from "axios";
import { ApiResponse } from "../types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// CSRFトークンをグローバルに保持するための変数
let csrfToken: string | null = null;

// CSRFトークンを取得する関数
export async function fetchCsrfToken() {
  try {
    const response = await axios.get<{ token: string }>(`${API_URL}/csrf/token`, {
      withCredentials: true // クッキーを送受信するために必要
    });
    
    if (response.data && response.data.token) {
      csrfToken = response.data.token;
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error("CSRFトークン取得エラー:", error);
    return null;
  }
}

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
    // アクセストークンをヘッダーに追加
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CSRFトークンをヘッダーに追加（非GETリクエストの場合）
    if (config.method !== 'get') {
      // トークンがなければ取得を試みる
      if (!csrfToken) {
        csrfToken = await fetchCsrfToken(); // 結果を直接代入
      }
      
      if (csrfToken) {
        console.log('CSRFトークンをヘッダーに設定:', csrfToken); // デバッグ用
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        console.warn('CSRFトークンが設定できませんでした'); // デバッグ用
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
          // アクセストークンのみローカルストレージに保存
          localStorage.setItem("accessToken", response.data.data.accessToken);
          
          // リクエストヘッダーを更新
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("トークンリフレッシュエラー:", refreshError);
      }
      
      // 認証関連の情報をクリア
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    // 403エラー（CSRF検証失敗）の処理
    if (error.response?.status === 403 && 
        error.response?.data?.error?.code === 'CSRF_TOKEN_INVALID' &&
        !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      
      try {
        // CSRFトークンを再取得
        await fetchCsrfToken();
        
        if (csrfToken) {
          // 再取得したトークンでリクエストを再試行
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
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
  fetchCsrfToken().catch(console.error);
}