// /mnt/c/21_procure-saas/procure-erp-frontend/lib/api/mfa.ts

import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { csrfManager } from './csrf-manager';

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
   * CSRF保護が適用されるため、GETリクエストでもCSRFトークンを付与
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    // CSRFトークンを事前に強制更新（最適化後のCSRF保護対応）
    try {
      await csrfManager.refreshToken();
      console.log('MFA設定初期化前にCSRFトークンを更新しました');
    } catch (error) {
      console.error('MFA設定初期化前のCSRFトークン更新エラー:', error);
      // エラーがあってもリクエスト自体は試みる
    }
    
    const response = await apiClient.get<MfaSetupResponse>('/auth/mfa/setup');
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFA設定の初期化に失敗しました');
  },
  
  /**
   * MFAの有効化
   * 重要な操作のため、特別なCSRF処理を実装
   */
  async enableMfa(secret: string, token: string): Promise<MfaEnableResponse> {
    // CSRFトークンを事前に強制更新（直前に必ず再取得）
    try {
      await csrfManager.refreshToken();
      console.log('MFA有効化前にCSRFトークンを強制更新しました');
    } catch (error) {
      console.error('MFA有効化前のCSRFトークン更新エラー:', error);
      // エラーがあってもリクエスト自体は試みる
    }
    
    // APIリクエスト
    try {
      const response = await apiClient.post<MfaEnableResponse>('/auth/mfa/enable', {
        secret,
        token,
      });
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      throw new Error('MFAの有効化に失敗しました');
    } catch (error: any) {
      // CSRF検証エラーの特別処理
      if (error?.response?.status === 403 && 
          (error?.response?.data?.error?.code === 'CSRF_TOKEN_MISSING' ||
           error?.response?.data?.error?.code === 'CSRF_TOKEN_INVALID')) {
        
        console.error('MFA有効化でCSRF検証エラーが発生しました。再試行します...', error);
        
        // CSRFトークンを強制再取得して再試行
        try {
          await csrfManager.refreshToken();
          console.log('CSRF検証エラー後にトークンを再取得しました');
          
          // 再試行
          const retryResponse = await apiClient.post<MfaEnableResponse>('/auth/mfa/enable', {
            secret,
            token,
          });
          
          if (retryResponse.status === 'success' && retryResponse.data) {
            console.log('MFA有効化の再試行が成功しました');
            return retryResponse.data;
          }
        } catch (retryError) {
          console.error('MFA有効化の再試行も失敗しました:', retryError);
        }
      }
      
      // 元のエラーを再スロー
      throw error;
    }
  },
  
  /**
   * MFAの無効化
   * 重要な操作のため、CSRF保護が適用される
   */
  async disableMfa(): Promise<{ disabled: boolean }> {
    // CSRFトークンを事前に強制更新（最適化後のCSRF保護対応）
    try {
      await csrfManager.refreshToken();
      console.log('MFA無効化前にCSRFトークンを更新しました');
    } catch (error) {
      console.error('MFA無効化前のCSRFトークン更新エラー:', error);
      // エラーがあってもリクエスト自体は試みる
    }
    
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
   * CSRF保護が適用されるため、CSRFトークンの事前更新を行う
   */
  async verifyRecoveryCode(code: string): Promise<MfaVerifyResponse> {
    // CSRFトークンを事前に強制更新（最適化後のCSRF保護対応）
    try {
      await csrfManager.refreshToken();
      console.log('リカバリーコード検証前にCSRFトークンを更新しました');
    } catch (error) {
      console.error('リカバリーコード検証前のCSRFトークン更新エラー:', error);
      // エラーがあってもリクエスト自体は試みる
    }
    
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
   * CSRF保護が適用されるため、GETリクエストでもCSRFトークンを付与
   */
  async getMfaStatus(): Promise<MfaStatusResponse> {
    // CSRFトークンを事前に強制更新（最適化後のCSRF保護対応）
    try {
      await csrfManager.refreshToken();
      console.log('MFA状態確認前にCSRFトークンを更新しました');
    } catch (error) {
      console.error('MFA状態確認前のCSRFトークン更新エラー:', error);
      // エラーがあってもリクエスト自体は試みる
    }
    
    const response = await apiClient.get<MfaStatusResponse>('/auth/mfa/status');
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('MFA状態の取得に失敗しました');
  }
};