// src/lib/api/auth.ts

import { apiClient } from './client';
import { User, ApiResponse } from '../types/api';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface LoginResponse {
  user: User | null;
  requireMfa?: boolean;
}

export const authApi = {
  async login(username: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
    const response = await apiClient.post<{
      user: User;
      requireMfa?: boolean;
    }>('/auth/login', {
      username,
      password,
      rememberMe,
    });
    
    if (response.status === 'success' && response.data) {
      // アクセストークンとリフレッシュトークンはCookieに自動保存される
      return {
        user: response.data.user,
        requireMfa: response.data.requireMfa, // MFA要求フラグ
      };
    }
    
    return {
      user: null,
    };
  },
  
  async refreshToken(): Promise<boolean> {
    // リフレッシュトークンはCookieにあるので自動送信される
    try {
      const response = await apiClient.post<{
        user: User;
      }>('/auth/refresh', {});
      
      return response.status === 'success' && !!response.data;
    } catch (error) {
      return false;
    }
  },
  
  async logout(): Promise<void> {
    // トークンはCookieにあるので自動的に送信される
    // バックエンドでトークンがブラックリストに追加され、Cookieも削除される
    await apiClient.post<void>('/auth/logout');
  },
  
  async checkAuth(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ authenticated: boolean }>('/auth/check');
      return response.status === 'success' && response.data?.authenticated === true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * ユーザープロファイル情報を取得
   * JWTAuthGuardで保護されたエンドポイントを使用
   */
  async getProfile(): Promise<User | null> {
    try {
      // トークンはCookieから自動送信される
      const response = await apiClient.get<{ user: User }>('/auth/profile');
      
      if (response.status === 'success' && response.data?.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('プロファイル取得エラー:', error);
      return null;
    }
  }
};

export const loginWithoutCsrf = async (username: string, password: string) => {
  try {
    // 直接Axiosを使用し、CSRFトークンなしでリクエスト
    const response = await axios.post(
      `${API_URL}/auth/login`, 
      { username, password },
      { withCredentials: true }
    );
    
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || '認証に失敗しました');
  } catch (error) {
    console.error('ログインエラー:', error);
    throw error;
  }
};