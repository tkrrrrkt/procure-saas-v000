// src/lib/api/csrf-manager.ts

import { axiosInstance } from "./axios";

/**
 * CSRFトークン管理クラス
 * シングルトンパターンでグローバルに一つのインスタンスを保持
 * axiosInstanceを使用して一貫性を確保
 */
export class CsrfTokenManager {
  private static instance: CsrfTokenManager;
  private token: string | null = null;
  private fetchPromise: Promise<string | null> | null = null;
  private lastFetchTime: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15分
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24時間
  
  private constructor() {
    if (typeof window !== 'undefined') {
      // ページ非アクティブ → アクティブ時にトークンをリフレッシュ
      window.addEventListener('focus', () => {
        // 最後の取得から TOKEN_REFRESH_INTERVAL 以上経過していれば再取得
        const timeSinceLastFetch = Date.now() - this.lastFetchTime;
        if (timeSinceLastFetch > this.TOKEN_REFRESH_INTERVAL) {
          this.refreshToken().catch(error => {
            console.error('フォーカス時のCSRFトークン更新エラー:', error);
          });
        }
      });
    }
  }
  
  /**
   * シングルトンインスタンスを取得
   */
  static getInstance() {
    if (!CsrfTokenManager.instance) {
      CsrfTokenManager.instance = new CsrfTokenManager();
    }
    return CsrfTokenManager.instance;
  }
  
  /**
   * CSRFトークンを取得
   * - すでにトークンがある場合はそれを返す
   * - なければサーバーから取得
   * - 同時複数リクエストを防止するためのロック機構付き
   * - 有効期限チェック追加
   */
  async getToken(): Promise<string | null> {
    // トークンがあり、かつ有効期限内であれば再利用
    if (this.token && Date.now() - this.lastFetchTime < this.TOKEN_EXPIRY) {
      return this.token;
    }
    
    // 現在取得中のリクエストがある場合はそれを待つ
    if (this.fetchPromise) {
      return this.fetchPromise;
    }
    
    // 新しくトークンを取得
    this.fetchPromise = this.fetchToken();
    const newToken = await this.fetchPromise;
    this.fetchPromise = null;
    
    if (newToken) {
      this.lastFetchTime = Date.now();
    }
    
    return newToken;
  }
  
  /**
   * サーバーからCSRFトークンを取得
   * メインのaxiosインスタンスを使用するよう修正
   * レスポンス形式の完全対応
   */
  private async fetchToken(): Promise<string | null> {
    try {
      console.log('CSRFトークンをサーバーから取得しています...');
      
      // メインのaxiosインスタンスを使用
      const response = await axiosInstance.get('/csrf/token');
      
      // 通常のAPIレスポンス形式への対応
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        console.log('CSRFトークンを取得しました (API形式):', this.token.substring(0, 8) + '...');
        return this.token;
      }
      
      // 単純な{ token: string }形式への対応
      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('CSRFトークンを取得しました (直接形式):', this.token.substring(0, 8) + '...');
        return this.token;
      }
      
      console.warn('CSRFトークン取得レスポンスにtokenが含まれていません', response.data);
      
      // cookie内のトークンを直接取得する（フォールバック）
      const cookieToken = this.getTokenFromCookie();
      if (cookieToken) {
        console.log('CSRFトークンをCookieから取得しました:', cookieToken.substring(0, 8) + '...');
        this.token = cookieToken;
        return cookieToken;
      }
      
      return null;
    } catch (error) {
      console.error("CSRFトークン取得エラー:", error);
      
      // エラー時はcookieからの取得を試みる
      const cookieToken = this.getTokenFromCookie();
      if (cookieToken) {
        console.log('エラー発生後、CSRFトークンをCookieから取得しました:', cookieToken.substring(0, 8) + '...');
        this.token = cookieToken;
        return cookieToken;
      }
      
      return null;
    }
  }
  
  /**
   * Cookieからcsrf_tokenを直接取得するフォールバックメソッド
   */
  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token' && value) {
        return value;
      }
    }
    return null;
  }
  
  /**
   * 強制的にトークンを再取得
   */
  async refreshToken(): Promise<string | null> {
    this.clearToken();
    return this.getToken();
  }
  
  /**
   * トークンをクリア
   */
  clearToken() {
    this.token = null;
    this.fetchPromise = null;
    this.lastFetchTime = 0;
  }
  
  /**
   * 現在のトークン情報を確認するデバッグメソッド
   */
  getDebugInfo() {
    return {
      hasToken: Boolean(this.token),
      tokenPrefix: this.token ? this.token.substring(0, 8) + '...' : null,
      lastFetchTime: this.lastFetchTime ? new Date(this.lastFetchTime).toISOString() : null,
      timeSinceLastFetch: this.lastFetchTime ? Date.now() - this.lastFetchTime : null,
      isExpired: this.lastFetchTime ? (Date.now() - this.lastFetchTime > this.TOKEN_EXPIRY) : true,
    };
  }
}

// エクスポート
export const csrfManager = CsrfTokenManager.getInstance();