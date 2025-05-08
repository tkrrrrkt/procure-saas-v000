// src/common/notifications/providers/in-app-notification.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationProvider } from '../interfaces/notification-provider.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * アプリ内通知プロバイダー
 * メモリに通知を保存（開発用）
 */
@Injectable()
export class InAppNotificationProvider implements NotificationProvider {
  id = 'in-app';
  name = 'アプリ内通知';
  
  private readonly logger = new Logger(InAppNotificationProvider.name);
  private inMemoryNotifications: Array<{userId: string, payload: NotificationPayload, timestamp: Date, read: boolean}> = [];
  
  constructor(private prisma: PrismaService) {}
  
  /**
   * アプリ内通知は常に設定済み
   */
  isConfigured(): boolean {
    return true;
  }
  
  /**
   * アプリ内通知を送信（メモリに保存）
   * @param recipients 受信者のユーザーID配列
   * @param payload 通知の内容
   */
  async send(recipients: string[], payload: NotificationPayload): Promise<boolean> {
    try {
      // 各受信者用の通知データを準備
      for (const userId of recipients) {
        // インメモリに通知を保存
        this.inMemoryNotifications.push({
          userId,
          payload,
          timestamp: new Date(),
          read: false
        });
        
        this.logger.log(`アプリ内通知: ユーザー ${userId} に "${payload.subject}" を送信`);
      }
      
      /* 
      // Prismaモデルが実装されたら以下のコードを使用
      const notificationData = recipients.map(userId => ({
        user_id: userId,
        title: payload.subject,
        message: payload.message,
        severity: payload.severity,
        metadata: payload.metadata || {},
        read: false,
        created_at: new Date()
      }));
      
      // トランザクションで一括保存
      await this.prisma.$transaction(
        notificationData.map(data => 
          this.prisma.notification.create({ data })
        )
      );
      */
      
      this.logger.log(`${recipients.length}人のユーザーにアプリ内通知 "${payload.subject}" を保存しました`);
      
      return true;
    } catch (error) {
      this.logger.error(`アプリ内通知の保存エラー: ${error.message}`, error.stack);
      return false;
    }
  }
  
  // テスト用メソッド
  getNotificationsForUser(userId: string): Array<{payload: NotificationPayload, timestamp: Date, read: boolean}> {
    return this.inMemoryNotifications
      .filter(notification => notification.userId === userId)
      .map(({payload, timestamp, read}) => ({payload, timestamp, read}));
  }
}