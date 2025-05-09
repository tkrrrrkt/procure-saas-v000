// src/core/auth/strategies/jwt.strategy.ts

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenBlacklistService } from '../token-blacklist.service';

// JWTペイロードの型定義
interface JwtPayload {
  sub: string;
  username: string;
  role?: string;
  tenant_id?: string;
  // 他の必要なフィールド
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      // cookieからトークンを抽出する関数を追加
      jwtFromRequest: (req) => {
        // まずCookieからトークンを取得
        let token = null;
        if (req && req.cookies) {
          token = req.cookies['access_token'];
        }
        
        // Cookieにトークンがない場合はヘッダーからも取得を試みる
        // これにより既存の認証方式との後方互換性を保つ
        if (!token) {
          token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        }
        
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // requestオブジェクトをコールバックに渡す
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    // リクエストからトークンを取得
    const token = this.extractTokenFromRequest(request);
    
    // トークンがブラックリストに登録されているか確認
    if (token && await this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('このトークンは無効化されています');
    }

    // 通常の検証ロジック
    // payload からユーザー情報を返す
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      tenant_id: payload.tenant_id,
    };
  }

  /**
   * リクエストからトークンを抽出
   */
  private extractTokenFromRequest(request: Request): string | null {
    // Cookieからトークンを取得
    if (request.cookies && request.cookies['access_token']) {
      return request.cookies['access_token'];
    }
    
    // ヘッダーからトークンを取得
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}