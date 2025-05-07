// lib/api/csrf.ts
export async function fetchCsrfToken() {
    try {
      const response = await fetch('/api/csrf/token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('CSRFトークンの取得に失敗しました');
      }
      
      const data = await response.json();
      
      // グローバルにCSRFトークンを保存する（TypeScriptエラー回避のための宣言拡張）
      if (typeof window !== 'undefined') {
        // TypeScriptのグローバル型を拡張
        (window as any).__CSRF_TOKEN__ = data.token;
      }
      
      return data.token;
    } catch (error) {
      console.error('CSRFトークン取得エラー:', error);
      return null;
    }
  }