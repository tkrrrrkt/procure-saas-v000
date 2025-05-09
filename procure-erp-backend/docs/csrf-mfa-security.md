# CSRF保護とMFA連携の最適化

## 概要

このドキュメントでは、CSRF（Cross-Site Request Forgery）保護とMFA（多要素認証）実装の連携に関する改善内容を説明します。

## 実装前の問題点

既存の実装では、MFA関連の全エンドポイントが一律にCSRF保護から除外されていました：

```typescript
const exemptPaths = [
  'auth/login',
  'auth/refresh', 
  'auth/mfa', // MFA関連のエンドポイントをCSRF検証から除外 <- 問題点
  'csrf/token',
  'health-check',
  'api-docs'
];
```

このアプローチには以下の問題点がありました：

1. MFA機能の有効化/無効化などの重要な操作まで含めて保護が外れていた
2. MFA設定操作がCSRF攻撃に対して脆弱になっていた
3. すべてのMFA関連パスを一律に除外することで、細かい保護のカスタマイズができなかった

## 改善アプローチ

改善実装では、MFA関連エンドポイントを以下の2つのカテゴリに分類しました：

1. **認証プロセスの一部として必要なエンドポイント**
   - `/auth/mfa/verify` - MFAトークン検証
   - `/auth/mfa/recovery` - リカバリーコード検証
   - `/auth/mfa/status` - MFA状態確認（情報取得のみのGETリクエスト）

2. **高セキュリティ操作（CSRF保護必須）**
   - `/auth/mfa/setup` - MFA設定情報取得
   - `/auth/mfa/enable` - MFA有効化
   - `/auth/mfa/disable` - MFA無効化

これにより、認証プロセスの円滑な動作を維持しつつ、セキュリティ上重要な操作については適切なCSRF保護を確保できます。

## 実装変更点

### CSRFミドルウェアの修正

`CsrfMiddleware` クラスの `isExemptPath` メソッドを修正し、MFA関連パスに対するより細かい除外制御を実装しました：

```typescript
private isExemptPath(path: string): boolean {
  // グローバルプレフィックスを考慮して正規化
  const normalizedPath = path.replace(/^\\/+|\\/+$/g, '');
  
  // 基本的なCSRF除外パス
  const basicExemptPaths = [
    'auth/login',
    'auth/refresh', 
    'csrf/token',
    'health-check',
    'api-docs'
  ];
  
  // MFA関連の除外パス（認証フロー関連のみ）
  const mfaExemptPaths = [
    'auth/mfa/verify',   // MFAトークン検証（認証プロセスの一部）
    'auth/mfa/recovery', // リカバリーコード検証（認証プロセスの一部）
    'auth/mfa/status',   // MFA状態確認（情報取得のみ）
  ];
  
  // 完全な除外パスリスト
  const exemptPaths = [...basicExemptPaths, ...mfaExemptPaths];
  
  // MFA関連のパスであれば詳細なログを出力
  const isMfaPath = normalizedPath.includes('auth/mfa');
  const isMfaExemptPath = mfaExemptPaths.some(mfaPath => 
    normalizedPath === `api/${mfaPath}` || normalizedPath.startsWith(`api/${mfaPath}/`)
  );
  
  if (isMfaPath) {
    if (isMfaExemptPath) {
      this.logger.warn(`MFA認証フローパスを検出: ${normalizedPath} - CSRF検証から除外します`);
    } else {
      this.logger.info(`MFA設定パスを検出: ${normalizedPath} - CSRF検証を適用します`);
    }
  }
  
  const result = exemptPaths.some(exempt => {
    return normalizedPath === `api/${exempt}` || 
          normalizedPath.startsWith(`api/${exempt}/`);
  });
  
  return result;
}
```

## テスト方法

この変更をテストするため、テストスクリプト `scripts/test-mfa-csrf.ts` を作成しました。このスクリプトは各MFAエンドポイントをCSRFトークンあり/なしの両方のケースでテストし、期待通りの動作を確認します。

### テストの実行方法

1. アプリケーションサーバーが実行されていることを確認
2. 有効なJWTトークンを取得し、スクリプト内の `JWT_TOKEN` 変数を更新
3. 以下のコマンドを実行

```bash
cd procure-erp-backend
npx ts-node scripts/test-mfa-csrf.ts
```

### 期待される結果

- 保護が必要なエンドポイント（setup, enable, disable）：
  - CSRFトークンなし → 403エラー
  - CSRFトークンあり → 成功（または認証エラー以外）

- 保護が除外されたエンドポイント（verify, recovery, status）：
  - CSRFトークンの有無に関わらずリクエストが処理される

## セキュリティ上の考慮事項

この実装によって、MFAセキュリティが向上しました：

1. MFA設定の変更（有効化/無効化）はCSRF保護によって守られるため、攻撃者はより難しい攻撃を試みる必要があります

2. 同時に、MFA認証フロー自体（verify, recovery）はCSRF保護の除外リストに含まれているため、認証プロセスが円滑に動作します

3. MFA関連のパスにアクセスした際の詳細なログ出力により、潜在的な問題の調査が容易になります
