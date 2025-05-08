// src/common/notifications/providers/email-notification.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer'; // 代わりにhttps moduleを使用

import * as https from 'https';
import { NotificationProvider } from '../interfaces/notification-provider.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * メール通知プロバイダー
 * 外部メールAPIを使用してメール通知を送信する
 */
@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  id = 'email';
  name = 'メール通知';
  
  private readonly logger = new Logger(EmailNotificationProvider.name);
  
  constructor(private configService: ConfigService) {}
  
  /**
   * メール通知が設定されているかチェック
   */
  isConfigured(): boolean {
    // SendGridのAPIキーが設定されているかチェック
    return !!this.configService.get<string>('EMAIL_API_KEY');
  }
  
  /**
   * メール通知を送信
   * @param recipients 受信者のメールアドレス配列
   * @param payload 通知の内容
   */
  async send(recipients: string[], payload: NotificationPayload): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('メールプロバイダーが設定されていないため、通知を送信できません');
      return false;
    }
    
    try {
      // 外部APIキー 
      const apiKey = this.configService.get<string>('EMAIL_API_KEY');
      const fromEmail = this.configService.get<string>('MAIL_FROM', 'notification@example.com');
      
      this.logger.log(`メール送信をシミュレート: ${recipients.join(', ')} 宛に "${payload.subject}" を送信`);
      
      // 実際の実装では外部メールAPIを呼び出す
      // ここではログ出力のみとし、実際のAPIコールは行わない
      this.logger.verbose(`件名: ${payload.subject}`);
      this.logger.verbose(`本文: ${payload.message}`);
      this.logger.verbose(`重要度: ${payload.severity}`);
      
      return true;
    } catch (error) {
      this.logger.error(`メール送信エラー: ${error.message}`, error.stack);
      return false;
    }
  }
  
  /**
   * HTMLメール本文を生成
   * @param payload 通知の内容
   */
  private generateHtmlContent(payload: NotificationPayload): string {
    const severityColor = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
    };
    
    const severityLabel = {
      low: '低',
      medium: '中',
      high: '高',
    };
    
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">${payload.subject}</h2>
        
        <div style="padding: 15px; background-color: #f8f8f8; border-left: 5px solid ${severityColor[payload.severity]}; margin: 20px 0;">
          ${payload.message.replace(/\n/g, '<br>')}
        </div>
        
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 5px 0;"><strong>重要度:</strong> <span style="color: ${severityColor[payload.severity]};">${severityLabel[payload.severity]}</span></p>
          <p style="margin: 5px 0;"><strong>時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        </div>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px; text-align: center;">
          このメールは自動送信されています。ご不明点があれば管理者にお問い合わせください。
        </p>
      </div>
    `;
  }
}