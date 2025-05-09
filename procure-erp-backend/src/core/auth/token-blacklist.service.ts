import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly keyPrefix = 'token:blacklist:';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * JWTトークンをブラックリストに追加（無効化）
   * @param token JWTトークン
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // トークンをデコードしてペイロードを取得
      const payload = this.jwtService.decode(token);
      if (!payload || typeof payload !== 'object') {
        throw new Error('無効なトークン形式');
      }

      // トークンの有効期限を取得（expはJWT標準の有効期限フィールド）
      const exp = payload.exp;
      if (!exp) {
        throw new Error('トークンに有効期限が設定されていません');
      }

      // 現在のUNIX時間を取得
      const now = Math.floor(Date.now() / 1000);
      
      // 有効期限までの残り秒数を計算
      const ttl = Math.max(0, exp - now);

      // ブラックリストにトークンを追加（キーはトークン自体のハッシュ値）
      // 値は関係ないので1とし、TTLを有効期限に設定
      const tokenHash = this.createTokenHash(token);
      await this.redis.set(`${this.keyPrefix}${tokenHash}`, '1', 'EX', ttl);
      
      this.logger.debug(`トークンをブラックリストに追加: ${tokenHash.substring(0, 8)}..., TTL: ${ttl}秒`);
    } catch (error) {
      this.logger.error(`トークンのブラックリスト処理に失敗しました: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * トークンがブラックリストに登録されているか確認
   * @param token JWTトークン
   * @returns トークンが無効の場合はtrue、有効なら存在しないのでfalse
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.createTokenHash(token);
      const exists = await this.redis.exists(`${this.keyPrefix}${tokenHash}`);
      return exists === 1;
    } catch (error) {
      this.logger.error(`ブラックリスト確認に失敗しました: ${error.message}`, error.stack);
      // エラー時は安全側に倒してtrueを返す（無効とみなす）
      return true;
    }
  }

  /**
   * トークンをハッシュ化してストレージキーを生成
   * @param token JWTトークン
   * @returns トークンのハッシュ値
   */
  private createTokenHash(token: string): string {
    // 単純な実装としてトークン自体をキーとして使用
    // 運用環境では暗号学的にセキュアなハッシュ関数を使用すべき
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}