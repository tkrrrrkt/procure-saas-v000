// src/common/notifications/services/notification.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { NotificationProvider } from '../interfaces/notification-provider.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * 通知サービス
 * 複数の通知プロバイダーを管理し、通知の送信を処理する
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private providers: Map<string, NotificationProvider> = new Map();

  /**
   * 通知プロバイダーを登録する
   * @param provider 登録するプロバイダー
   */
  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.id, provider);
    this.logger.log(`通知プロバイダー "${provider.name}" (${provider.id}) を登録しました`);
  }

  /**
   * 通知を送信する
   * @param providerId 使用するプロバイダーID（単一または複数）
   * @param recipients 受信者のID
   * @param payload 通知の内容
   * @returns 各プロバイダーの送信結果
   */
  async sendNotification(
    providerId: string | string[],
    recipients: string[],
    payload: NotificationPayload
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // 送信先プロバイダーIDを配列に統一
    const providerIds = Array.isArray(providerId) ? providerId : [providerId];
    
    // 有効な受信者がいない場合は何もしない
    if (!recipients || recipients.length === 0) {
      this.logger.warn('受信者が指定されていないため、通知を送信しません');
      return {};
    }
    
    this.logger.log(`"${payload.subject}" の通知を ${providerIds.join(', ')} プロバイダーで ${recipients.length} 人に送信します`);
    
    // 各プロバイダーで送信を実行
    for (const id of providerIds) {
      const provider = this.providers.get(id);
      
      if (!provider) {
        this.logger.warn(`プロバイダー "${id}" が見つかりません`);
        results[id] = false;
        continue;
      }
      
      if (!provider.isConfigured()) {
        this.logger.warn(`プロバイダー "${id}" は設定されていないため、送信をスキップします`);
        results[id] = false;
        continue;
      }
      
      try {
        // プロバイダーで通知を送信
        const success = await provider.send(recipients, payload);
        results[id] = success;
        
        if (success) {
          this.logger.log(`プロバイダー "${id}" で通知の送信に成功しました`);
        } else {
          this.logger.warn(`プロバイダー "${id}" で通知の送信に失敗しました`);
        }
      } catch (error) {
        this.logger.error(`プロバイダー "${id}" で通知の送信中にエラーが発生しました: ${error.message}`, error.stack);
        results[id] = false;
      }
    }
    
    return results;
  }

  /**
   * 設定済みの通知プロバイダーの一覧を取得する
   * @returns 設定済みプロバイダーのID配列
   */
  getConfiguredProviders(): string[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.isConfigured())
      .map(provider => provider.id);
  }
  
  /**
   * 使用可能なすべての通知プロバイダー情報を取得する
   * @returns プロバイダー情報の配列
   */
  getAllProviders(): Array<{ id: string; name: string; configured: boolean }> {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured()
    }));
  }
}