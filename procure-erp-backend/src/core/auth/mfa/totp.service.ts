// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/mfa/totp.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TotpService {
  private readonly logger = new Logger(TotpService.name);
  private readonly issuer: string;
  
  constructor(private readonly configService: ConfigService) {
    // アプリケーション名を設定（MFA認証アプリに表示される）
    this.issuer = this.configService.get<string>('MFA_ISSUER', '購買管理SaaS');
    
    // セキュリティ設定
    authenticator.options = {
      window: 1,           // 前後のウィンドウを許容（デフォルト）
      digits: 6,           // 6桁のコード
      step: 30,            // 30秒間隔
    };
  }

  /**
   * ユーザー向けのシークレットを生成
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * TOTPの認証URI（otpauth://）を生成
   */
  generateOtpAuthUri(username: string, secret: string): string {
    return authenticator.keyuri(username, this.issuer, secret);
  }

  /**
   * QRコードを生成（Base64エンコード）
   */
  async generateQrCode(otpAuthUri: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUri);
      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error(`QRコード生成エラー: ${error.message}`);
      throw new Error('QRコードの生成に失敗しました');
    }
  }

  /**
   * TOTPトークンの検証
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      this.logger.error(`TOTP検証エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * リカバリーコードの生成（16個）
   */
  generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 16; i++) {
      const code = randomBytes(10).toString('hex').toUpperCase();
      // 読みやすさのために4文字ごとにハイフンを挿入
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`);
    }
    return codes;
  }

  /**
   * リカバリーコードをハッシュ化して保存（セキュリティ向上）
   */
  hashRecoveryCodes(codes: string[]): string[] {
    return codes.map(code => {
      const normalizedCode = code.replace(/-/g, '').toUpperCase();
      return createHash('sha256').update(normalizedCode).digest('hex');
    });
  }

  /**
   * リカバリーコードの検証
   */
  verifyRecoveryCode(inputCode: string, hashedCodes: string[]): { valid: boolean; index: number } {
    const normalizedCode = inputCode.replace(/-/g, '').toUpperCase();
    const inputHash = createHash('sha256').update(normalizedCode).digest('hex');
    
    const index = hashedCodes.findIndex(hash => hash === inputHash);
    
    return {
      valid: index >= 0,
      index
    };
  }
}