// src/lib/api/auth.ts

import { apiClient } from './client';
import { User, ApiResponse } from '../types/api';

export interface LoginResponse {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const authApi = {
  async login(username: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
    const response = await apiClient.post<{
      user: User;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/login', {
      username,
      password,
      rememberMe,
    });
    
    if (response.status === 'success' && response.data) {
      return {
        user: response.data.user,
        accessToken: response.data.accessToken || null,
        refreshToken: response.data.refreshToken || null,
      };
    }
    
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  },
  
  async refreshToken(refreshTokenValue: string): Promise<LoginResponse> {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      refreshToken: refreshTokenValue,
    });
    
    if (response.status === 'success' && response.data) {
      return {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
    };
  },
  
  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout');
  },
  
  async checkAuth(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ authenticated: boolean }>('/auth/check');
      return response.status === 'success' && response.data?.authenticated === true;
    } catch (error) {
      return false;
    }
  }
};