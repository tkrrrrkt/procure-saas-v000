// src/common/middleware/csrf.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  
  use(req: Request, res: Response, next: NextFunction) {
    // デバッグ出力の強化
    console.log(`===== CSRFミドルウェア実行 =====`);
    console.log(`リクエスト: ${req.method} ${req.path}`);
    
    // デバッグ情報の記録
    this.logger.debug(`===== CSRF検証 =====`);
    this.logger.debug(`メソッド: ${req.method}`);
    this.logger.debug(`オリジナルURL: ${req.originalUrl}`);
    this.logger.debug(`パス: ${req.path}`);
    this.logger.debug(`ベースURL: ${req.baseUrl}`);
    this.logger.debug(`ホスト: ${req.hostname}`);
    this.logger.debug('===================');
    
    // GETリクエスト、またはCSRFトークンチェック不要なエンドポイントはスキップ
    if (req.method === 'GET' || this.isExemptPath(req.path)) {
      if (req.method === 'GET' && !req.cookies['csrf_token']) {
        // GETリクエスト時にCSRFトークンがなければ新規生成
        const token = this.generateToken();
        res.cookie('csrf_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
      }
      next();
      return;
    }

    // POSTリクエスト等ではCSRFトークンの検証を行う
    const cookieToken = req.cookies['csrf_token'];
    // headerTokenを適切に処理して常に文字列になるようにする
    const headerToken = Array.isArray(req.headers['x-csrf-token']) 
      ? req.headers['x-csrf-token'][0] 
      : String(req.headers['x-csrf-token'] || '');

    this.logger.debug(`CSRFトークン検証: Cookie=${cookieToken ? '存在' : 'なし'}, Header=${headerToken ? '存在' : 'なし'}`);

    if (!cookieToken || !headerToken) {
      this.logger.warn('CSRFトークンが見つかりません', {
        cookieExists: !!cookieToken,
        headerExists: !!headerToken,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF保護のため、このリクエストは拒否されました',
        },
      });
    }
    
    if (cookieToken !== headerToken) {
      this.logger.warn('CSRFトークンが一致しません', {
        cookieTokenPrefix: cookieToken.substring(0, 8) + '...',
        headerTokenPrefix: headerToken.substring(0, 8) + '...',
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF保護のため、このリクエストは拒否されました',
        },
      });
    }

    this.logger.debug('CSRFトークン検証成功');

    // 検証成功後、新しいトークンを発行（Double Submit Cookie Patternの強化）
    const newToken = this.generateToken();
    res.cookie('csrf_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private isExemptPath(path: string): boolean {
    // グローバルプレフィックスを考慮して正規化
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    
    // '/api/'を除去したパスで比較
    // 基本的なCSRF除外パス
    const basicExemptPaths = [
      'auth/login',
      'auth/refresh', 
      'csrf/token',
      'health-check',
      'api-docs'
    ];
    
    // MFA関連の除外パス（認証フロー関連のみ - 最小限に最適化）
    // 初回認証時のMFA検証のみを除外（ログイン→MFA検証フロー）
    const mfaExemptPaths = [
      'auth/mfa/verify',   // MFAトークン検証（認証プロセスの一部）- 初回ログイン時に必要
      // 'auth/mfa/recovery' と 'auth/mfa/status' は除外せず、CSRF保護を適用
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
        this.logger.log(`MFA設定パスを検出: ${normalizedPath} - CSRF検証を適用します`);
      }
    }
    
    const result = exemptPaths.some(exempt => {
      return normalizedPath === `api/${exempt}` || 
            normalizedPath.startsWith(`api/${exempt}/`);
    });
    
    this.logger.debug(`Path ${normalizedPath} exempt check result: ${result}`);
    
    return result;
  }
}