// src/common/notifications/interfaces/notification-provider.interface.ts

import { NotificationPayload } from './notification-payload.interface';

/**
 * 通知プロバイダーのインターフェース
 * すべての通知チャネル（メール、Slack、アプリ内通知など）はこのインターフェースを実装する
 */
export interface NotificationProvider {
  /**
   * プロバイダーの一意識別子
   */
  id: string;
  
  /**
   * プロバイダーの表示名
   */
  name: string;
  
  /**
   * 通知を送信する
   * @param recipients 受信者のID（メールアドレスやユーザーIDなど）
   * @param payload 通知の内容
   * @returns 送信成功時はtrue、失敗時はfalse
   */
  send(recipients: string[], payload: NotificationPayload): Promise<boolean>;
  
  /**
   * プロバイダーが正しく設定されているかチェック
   * @returns 設定済みの場合はtrue、未設定の場合はfalse
   */
  isConfigured(): boolean;
}