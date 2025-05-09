// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/guards/mfa.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // JWT認証が既に実行されていることを前提
    if (!request.user) {
      throw new UnauthorizedException('認証が必要です');
    }

    // MFA除外リストをチェック（MFAをバイパスできるエンドポイント）
    const isExcluded = this.checkMfaExclusion(context);
    if (isExcluded) {
      return true;
    }

    const userId = request.user.sub;
    const loginAccountId = request.user.login_account_id;

    // ユーザーがMFAを有効化しているか確認
    let mfaEnabled = false;
    
    // LoginAccountが存在する場合、そちらを優先
    if (loginAccountId) {
      const loginAccount = await this.prisma.loginAccount.findUnique({
        where: { id: loginAccountId },
        select: { mfa_enabled: true },
      });
      
      if (loginAccount) {
        mfaEnabled = loginAccount.mfa_enabled;
      }
    } else {
      // 互換性のため（移行期間中）TestUserも確認
      const user = await this.prisma.testUser.findUnique({
        where: { id: userId },
        select: { mfa_enabled: true },
      });
      
      if (user) {
        mfaEnabled = user.mfa_enabled;
      }
    }

    // MFAが有効化されていない場合はパス
    if (!mfaEnabled) {
      return true;
    }

    // ヘッダーからMFA検証トークンを取得
    const mfaToken = this.extractMfaTokenFromHeader(request);
    if (!mfaToken) {
      throw new UnauthorizedException({
        code: 'MFA_REQUIRED',
        message: 'MFA認証が必要です',
      });
    }

    try {
      // MFAトークンを検証
      const decodedToken = this.jwtService.verify(mfaToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // トークンが同じユーザーのものかチェック
      if (decodedToken.sub !== userId || !decodedToken.mfa_verified) {
        throw new UnauthorizedException({
          code: 'INVALID_MFA_TOKEN',
          message: '無効なMFA認証トークンです',
        });
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException({
        code: 'INVALID_MFA_TOKEN',
        message: '無効または期限切れのMFA認証トークンです',
      });
    }
  }

  private extractMfaTokenFromHeader(request: any): string | undefined {
    const mfaToken = request.headers['x-mfa-token'];
    return mfaToken;
  }

  private checkMfaExclusion(context: ExecutionContext): boolean {
    // MFA検証が不要なエンドポイントリスト
    const excludePaths = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/auth/mfa/setup',
      '/api/auth/mfa/enable',
      '/api/auth/mfa/verify',
      '/api/auth/mfa/recovery',
      '/api/auth/mfa/status',
      '/api/csrf/token',
      '/api/health-check',
    ];

    const request = context.switchToHttp().getRequest();
    const path = request.path;

    return excludePaths.some(excludePath => path.includes(excludePath));
  }
}