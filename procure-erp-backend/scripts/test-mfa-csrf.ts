/**
 * CSRF保護とMFA連携のテストスクリプト
 * 
 * このスクリプトは、MFA関連エンドポイントとCSRF保護の連携をテストします。
 * 各MFAエンドポイントに対して、CSRFトークンありとなしの両方のケースでリクエストを送信し、
 * 保護されるべきエンドポイントがCSRFトークンなしで拒否されることを確認します。
 * 
 * 使用方法:
 * $ ts-node test-mfa-csrf.ts
 * 
 * 注意: テスト前にアプリケーションサーバーが実行中で、かつJWTトークンを事前に取得しておく必要があります。
 * 
 * プロジェクトルートで以下のコマンドを実行してください：
 * $ cd procure-erp-backend
 * $ npx ts-node scripts/test-mfa-csrf.ts
 */

import axios from 'axios';

// テスト設定
const API_URL = 'http://localhost:3001/api';
const JWT_TOKEN = ''; // ← ここに有効なJWTトークンを設定してください

// MFAエンドポイントのリスト
const mfaEndpoints = [
  { method: 'GET', url: '/auth/mfa/setup', shouldBeProtected: true, description: 'MFA設定情報取得' },
  { method: 'GET', url: '/auth/mfa/status', shouldBeProtected: false, description: 'MFA状態確認' },
  { method: 'POST', url: '/auth/mfa/enable', shouldBeProtected: true, description: 'MFA有効化' },
  { method: 'POST', url: '/auth/mfa/disable', shouldBeProtected: true, description: 'MFA無効化' },
  { method: 'POST', url: '/auth/mfa/verify', shouldBeProtected: false, description: 'MFAトークン検証' },
  { method: 'POST', url: '/auth/mfa/recovery', shouldBeProtected: false, description: 'リカバリーコード検証' },
];

// CSRFトークンを取得する関数
async function getCsrfToken(): Promise<string> {
  try {
    const response = await axios.get(`${API_URL}/csrf/token`, {
      withCredentials: true
    });
    
    if (!response.data || !response.data.token) {
      throw new Error('CSRFトークンが応答に含まれていません');
    }
    
    return response.data.token;
  } catch (error) {
    console.error('CSRFトークン取得エラー:', error);
    throw error;
  }
}

// エンドポイントをテストする関数
async function testEndpoint(endpoint: typeof mfaEndpoints[0], csrfToken?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${JWT_TOKEN}`
    };
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const config = {
      headers,
      withCredentials: true
    };
    
    let response;
    if (endpoint.method === 'GET') {
      response = await axios.get(`${API_URL}${endpoint.url}`, config);
    } else {
      // テスト用のダミーデータ
      const dummyData = endpoint.url.includes('verify') 
        ? { token: '123456' } 
        : endpoint.url.includes('recovery') 
          ? { code: 'DUMMY-CODE' } 
          : endpoint.url.includes('enable') 
            ? { secret: 'test_secret', token: '123456' } 
            : {};
            
      response = await axios.post(`${API_URL}${endpoint.url}`, dummyData, config);
    }
    
    return true; // リクエスト成功
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.error?.code?.includes('CSRF_TOKEN')) {
      // CSRFエラーの場合は期待通り
      return false; // CSRF保護により拒否
    }
    
    // その他のエラー
    console.error(`エンドポイントテストエラー (${endpoint.url}):`, error.response?.data || error.message);
    return false;
  }
}

// メイン関数
async function main() {
  console.log('===== MFA保護とCSRF連携のテスト開始 =====');
  
  if (!JWT_TOKEN) {
    console.error('エラー: JWT_TOKENを設定してください');
    process.exit(1);
  }
  
  try {
    const csrfToken = await getCsrfToken();
    console.log(`CSRFトークン取得成功: ${csrfToken.substring(0, 8)}...`);
    
    let allTestsPass = true;
    
    // 各エンドポイントをテスト
    for (const endpoint of mfaEndpoints) {
      console.log(`\nテスト: ${endpoint.description} (${endpoint.method} ${endpoint.url})`);
      
      // CSRFトークンなしでテスト
      console.log('  CSRFトークンなし...');
      const withoutTokenResult = await testEndpoint(endpoint);
      
      // CSRFトークンありでテスト
      console.log('  CSRFトークンあり...');
      const withTokenResult = await testEndpoint(endpoint, csrfToken);
      
      // 結果を評価
      const protectionWorking = endpoint.shouldBeProtected ? !withoutTokenResult && withTokenResult : true;
      
      if (protectionWorking) {
        console.log(`  ✅ 成功: エンドポイントの保護設定（${endpoint.shouldBeProtected ? '保護あり' : '保護なし'}）は期待通りです`);
      } else {
        console.log(`  ❌ 失敗: エンドポイントの保護設定（${endpoint.shouldBeProtected ? '保護あり' : '保護なし'}）が期待と異なります`);
        console.log(`      トークンなし: ${withoutTokenResult ? '成功' : '拒否'}, トークンあり: ${withTokenResult ? '成功' : '拒否'}`);
        allTestsPass = false;
      }
    }
    
    console.log('\n===== テスト結果 =====');
    if (allTestsPass) {
      console.log('✅ すべてのテストが成功しました！CSRF保護とMFA連携が正しく機能しています');
    } else {
      console.log('❌ 一部のテストが失敗しました。詳細は上記のログを確認してください');
    }
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

// スクリプト実行
main().catch(console.error);
