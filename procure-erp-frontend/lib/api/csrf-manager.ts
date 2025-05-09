// src/lib/api/csrf-manager.ts

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * CSRFトークン管理クラス
 * シングルトンパターンでグローバルに一つのインスタンスを保持
 */
export class CsrfTokenManager {
  private static instance: CsrfTokenManager;
  private token: string | null = null;
  private fetchPromise: Promise<string | null> | null = null;
  
  private constructor() {}
  
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
   */
  async getToken(): Promise<string | null> {
    // すでにトークンがある場合はそれを返す
    if (this.token) {
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
    
    return newToken;
  }
  
  /**
   * サーバーからCSRFトークンを取得
   */
  private async fetchToken(): Promise<string | null> {
    try {
      console.log('CSRFトークンをサーバーから取得しています...');
      
      const response = await axios.get<{ token: string }>(`${API_URL}/csrf/token`, {
        withCredentials: true // クッキーを送受信するために必要
      });
      
      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('CSRFトークンを取得しました:', this.token.substring(0, 8) + '...');
        return this.token;
      }
      
      console.warn('CSRFトークン取得レスポンスにtokenが含まれていません');
      return null;
    } catch (error) {
      console.error("CSRFトークン取得エラー:", error);
      return null;
    }
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
  }
}

// エクスポート
export const csrfManager = CsrfTokenManager.getInstance();