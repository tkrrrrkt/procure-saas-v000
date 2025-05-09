// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/mfa/mfa.service.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TotpService } from './totp.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * MFA初期設定（QRコード生成用）
   */
  async setupMfa(userId: string) {
    // ログインアカウント取得
    // JWTのペイロードのsubフィールドが従業員IDかLoginAccountIDかを判断
    let loginAccount;
    
    try {
      // まず直接LoginAccountのIDで検索
      loginAccount = await this.prisma.loginAccount.findUnique({
        where: { id: userId },
      });
      
      // 見つからない場合は、関連付けられた従業員IDで検索
      if (!loginAccount) {
        loginAccount = await this.prisma.loginAccount.findFirst({
          where: { emp_account_id: userId },
        });
      }
    } catch (error) {
      this.logger.error(`MFA設定エラー: ${error.message}`);
      throw new UnauthorizedException('ユーザー情報の取得に失敗しました');
    }

    if (!loginAccount) {
      // 旧システムとの互換性のため（移行期間中）
      try {
        const testUser = await this.prisma.testUser.findUnique({
          where: { id: userId },
        });
        
        if (testUser) {
          // この時点ではユーザーデータを更新しない（検証後に有効化）
          const secret = this.totpService.generateSecret();
          const otpAuthUri = this.totpService.generateOtpAuthUri(testUser.username, secret);
          const qrCodeDataUrl = await this.totpService.generateQrCode(otpAuthUri);
          const recoveryCodes = this.totpService.generateRecoveryCodes();
          
          return { secret, qrCodeDataUrl, recoveryCodes };
        }
      } catch (error) {
        this.logger.error(`TestUser MFA設定エラー: ${error.message}`);
      }
      
      throw new UnauthorizedException('ユーザーが見つかりません');
    }

    // 既にMFAが有効な場合は再設定できない
    if (loginAccount.mfa_enabled && loginAccount.mfa_secret) {
      throw new UnauthorizedException('MFAはすでに有効です');
    }

    // 新しいシークレットを生成
    const secret = this.totpService.generateSecret();

    // OTPの認証URIを生成
    const otpAuthUri = this.totpService.generateOtpAuthUri(loginAccount.username, secret);

    // QRコードを生成
    const qrCodeDataUrl = await this.totpService.generateQrCode(otpAuthUri);

    // リカバリーコード生成（UI表示用。有効化まで保存しない）
    const recoveryCodes = this.totpService.generateRecoveryCodes();

    // この時点ではユーザーデータを更新しない（検証後に有効化）
    return {
      secret,
      qrCodeDataUrl,
      recoveryCodes,
    };
  }

  /**
   * MFA有効化（トークン検証後）
   */
  async enableMfa(userId: string, token: string, secret: string) {
    // トークンを検証
    const isValid = this.totpService.verifyToken(token, secret);

    if (!isValid) {
      throw new UnauthorizedException('無効なMFAトークンです');
    }

    // リカバリーコード生成とハッシュ化
    const recoveryCodes = this.totpService.generateRecoveryCodes();
    const hashedCodes = this.totpService.hashRecoveryCodes(recoveryCodes);

    try {
      // ユーザー情報を取得
      let loginAccount = await this.findLoginAccountByUserId(userId);
      
      if (loginAccount) {
        // LoginAccountが見つかった場合は更新
        await this.prisma.loginAccount.update({
          where: { id: loginAccount.id },
          data: {
            mfa_enabled: true,
            mfa_secret: secret,
            mfa_backup_codes: hashedCodes,
            mfa_last_used: new Date(),
          },
        });
      } else {
        // 旧システム互換（移行期間中）
        await this.prisma.testUser.update({
          where: { id: userId },
          data: {
            mfa_enabled: true,
            mfa_secret: secret,
            mfa_backup_codes: hashedCodes,
            mfa_last_used: new Date(),
          },
        });
      }

      return {
        enabled: true,
        recoveryCodes, // クライアントに表示用（一度だけ表示）
      };
    } catch (error) {
      this.logger.error(`MFA有効化エラー: ${error.message}`);
      throw new Error('MFAの有効化に失敗しました');
    }
  }

  /**
   * ユーザーIDからLoginAccountを検索するヘルパーメソッド
   * JWTのペイロードのsubフィールドが従業員IDかLoginAccountIDかを判断
   */
  private async findLoginAccountByUserId(userId: string) {
    try {
      // まず直接LoginAccountのIDで検索
      let loginAccount = await this.prisma.loginAccount.findUnique({
        where: { id: userId },
      });
      
      // 見つからない場合は、関連付けられた従業員IDで検索
      if (!loginAccount) {
        loginAccount = await this.prisma.loginAccount.findFirst({
          where: { emp_account_id: userId },
        });
      }
      
      return loginAccount;
    } catch (error) {
      this.logger.error(`LoginAccount検索エラー: ${error.message}`);
      return null;
    }
  }

  /**
   * MFA無効化
   */
  async disableMfa(userId: string) {
    try {
      // ユーザー情報を取得
      const loginAccount = await this.findLoginAccountByUserId(userId);
      
      if (loginAccount) {
        // LoginAccountが見つかった場合は更新
        await this.prisma.loginAccount.update({
          where: { id: loginAccount.id },
          data: {
            mfa_enabled: false,
            mfa_secret: null,
            mfa_backup_codes: null,
            mfa_last_used: null,
          },
        });
      } else {
        // 旧システム互換（移行期間中）
        await this.prisma.testUser.update({
          where: { id: userId },
          data: {
            mfa_enabled: false,
            mfa_secret: null,
            mfa_backup_codes: null,
            mfa_last_used: null,
          },
        });
      }

      return {
        disabled: true,
      };
    } catch (error) {
      this.logger.error(`MFA無効化エラー: ${error.message}`);
      throw new Error('MFAの無効化に失敗しました');
    }
  }

  /**
   * MFAトークンの検証
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    // ユーザー取得
    const loginAccount = await this.findLoginAccountByUserId(userId);

    if (!loginAccount) {
      // 移行期間中の互換性対応
      const testUser = await this.prisma.testUser.findUnique({
        where: { id: userId },
      });
      
      if (!testUser || !testUser.mfa_enabled || !testUser.mfa_secret) {
        throw new UnauthorizedException('MFA未設定のユーザーです');
      }
      
      // トークンを検証
      const isValid = this.totpService.verifyToken(token, testUser.mfa_secret);
      
      if (isValid) {
        // 最終使用日時を更新
        await this.prisma.testUser.update({
          where: { id: userId },
          data: {
            mfa_last_used: new Date(),
          },
        });
      }
      
      return isValid;
    }

    if (!loginAccount.mfa_enabled || !loginAccount.mfa_secret) {
      throw new UnauthorizedException('MFA未設定のユーザーです');
    }

    // トークンを検証
    const isValid = this.totpService.verifyToken(token, loginAccount.mfa_secret);

    if (isValid) {
      // 最終使用日時を更新
      await this.prisma.loginAccount.update({
        where: { id: loginAccount.id },
        data: {
          mfa_last_used: new Date(),
        },
      });
    }

    return isValid;
  }

  /**
   * リカバリーコードの検証と使用
   */
  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    // ユーザー取得
    const loginAccount = await this.findLoginAccountByUserId(userId);

    if (!loginAccount) {
      // 移行期間中の互換性対応
      const testUser = await this.prisma.testUser.findUnique({
        where: { id: userId },
      });
      
      if (!testUser || !testUser.mfa_enabled || !testUser.mfa_backup_codes) {
        throw new UnauthorizedException('MFA未設定のユーザーです');
      }
      
      // リカバリーコードを検証
      const hashedCodes = testUser.mfa_backup_codes as string[];
      const { valid, index } = this.totpService.verifyRecoveryCode(code, hashedCodes);
      
      if (valid) {
        // 使用したコードを削除（1回限り）
        hashedCodes.splice(index, 1);
        
        // データベースを更新
        await this.prisma.testUser.update({
          where: { id: userId },
          data: {
            mfa_backup_codes: hashedCodes,
            mfa_last_used: new Date(),
          },
        });
        
        return true;
      }
      
      return false;
    }

    if (!loginAccount.mfa_enabled || !loginAccount.mfa_backup_codes) {
      throw new UnauthorizedException('MFA未設定のユーザーです');
    }

    // リカバリーコードを検証
    const hashedCodes = loginAccount.mfa_backup_codes as string[];
    const { valid, index } = this.totpService.verifyRecoveryCode(code, hashedCodes);

    if (valid) {
      // 使用したコードを削除（1回限り）
      hashedCodes.splice(index, 1);

      // データベースを更新
      await this.prisma.loginAccount.update({
        where: { id: loginAccount.id },
        data: {
          mfa_backup_codes: hashedCodes,
          mfa_last_used: new Date(),
        },
      });

      return true;
    }

    return false;
  }

  /**
   * MFA検証成功後のトークン生成（一時トークン）
   */
  generateMfaVerifiedToken(userId: string): string {
    // 明示的な exp プロパティは削除
    const payload = {
      sub: userId,
      mfa_verified: true,
    };

    // 代わりに options.expiresIn を使用
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '5m', // 5分間有効
    });
  }

  /**
   * ユーザーのMFA状態を取得
   */
  async getMfaStatus(userId: string) {
    console.log('MFA状態確認 - ユーザーID:', userId);
    const loginAccount = await this.findLoginAccountByUserId(userId);

    if (!loginAccount) {
      // 移行期間中は旧テーブルも確認
      console.log('LoginAccountが見つからないため、TestUserテーブルを確認');
      const testUser = await this.prisma.testUser.findUnique({
        where: { id: userId },
        select: {
          mfa_enabled: true,
          mfa_last_used: true,
        },
      });
      
      if (!testUser) {
        console.log('ユーザーが見つかりません:', userId);
        throw new UnauthorizedException('ユーザーが見つかりません');
      }
      
      console.log('TestUserのMFA状態:', { enabled: testUser.mfa_enabled, lastUsed: testUser.mfa_last_used });
      return {
        enabled: testUser.mfa_enabled,
        lastUsed: testUser.mfa_last_used,
      };
    }

    console.log('LoginAccountのMFA状態:', { enabled: loginAccount.mfa_enabled, lastUsed: loginAccount.mfa_last_used });
    return {
      enabled: loginAccount.mfa_enabled,
      lastUsed: loginAccount.mfa_last_used,
    };
  }
}