// /mnt/c/21_procure-saas/procure-erp-frontend/lib/api/mfa.ts

import { apiClient } from './client';
import { ApiResponse } from '../types/api';

export interface MfaSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  recoveryCodes: string[];
}

export interface MfaEnableResponse {
  enabled: boolean;
  recoveryCodes: string[];
}

export interface MfaVerifyResponse {
  verified: boolean;
  mfaToken: string;
}

export interface MfaStatusResponse {
  enabled: boolean;
  lastUsed: string | null;
}

export const mfaApi = {
  /**
   * MFA設定の初期化
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    const response = await apiClient.get<MfaSetupResponse>('/auth/mfa/setup');
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFA設定の初期化に失敗しました');
  },
  
  /**
   * MFAの有効化
   */
  async enableMfa(secret: string, token: string): Promise<MfaEnableResponse> {
    const response = await apiClient.post<MfaEnableResponse>('/auth/mfa/enable', {
      secret,
      token,
    });
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFAの有効化に失敗しました');
  },
  
  /**
   * MFAの無効化
   */
  async disableMfa(): Promise<{ disabled: boolean }> {
    const response = await apiClient.post<{ disabled: boolean }>('/auth/mfa/disable');
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFAの無効化に失敗しました');
  },
  
  /**
   * MFAトークンの検証
   */
  async verifyMfa(token: string): Promise<MfaVerifyResponse> {
    const response = await apiClient.post<MfaVerifyResponse>('/auth/mfa/verify', {
      token,
    });
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFAトークンの検証に失敗しました');
  },
  
  /**
   * リカバリーコードの検証
   */
  async verifyRecoveryCode(code: string): Promise<MfaVerifyResponse> {
    const response = await apiClient.post<MfaVerifyResponse>('/auth/mfa/recovery', {
      code,
    });
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('リカバリーコードの検証に失敗しました');
  },
  
  /**
   * MFA状態の確認
   */
  async getMfaStatus(): Promise<MfaStatusResponse> {
    const response = await apiClient.get<MfaStatusResponse>('/auth/mfa/status');
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFA状態の取得に失敗しました');
  }
};