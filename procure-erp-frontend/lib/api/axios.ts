// src/lib/api/axios.ts

import axios from "axios";
import { ApiResponse } from "../types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプター
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post<ApiResponse<{accessToken: string, refreshToken: string}>>(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          if (response.data.status === 'success' && response.data.data) {
            localStorage.setItem("accessToken", response.data.data.accessToken);
            if (response.data.data.refreshToken) {
              localStorage.setItem("refreshToken", response.data.data.refreshToken);
            }
            
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("トークンリフレッシュエラー:", refreshError);
      }
      
      // 認証関連の情報をクリア
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      
      if (typeof window !== "undefined") {
        window.location.href = "/login";
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