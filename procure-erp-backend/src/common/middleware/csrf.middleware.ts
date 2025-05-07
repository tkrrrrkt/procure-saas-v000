// src/common/middleware/csrf.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF保護のため、このリクエストは拒否されました',
        },
      });
    }

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
    // CSRF検証が不要なパスを定義（例: 認証エンドポイント）
    const exemptPaths = ['/api/auth/login', '/api/auth/logout'];
    return exemptPaths.some(exempt => path.startsWith(exempt));
  }
}