// src/common/notifications/providers/slack-notification.provider.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { NotificationProvider } from '../interfaces/notification-provider.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * Slack通知プロバイダー
 * Incoming WebhookでSlackに通知を送信する
 */
@Injectable()
export class SlackNotificationProvider implements NotificationProvider {
  id = 'slack';
  name = 'Slack通知';
  
  private readonly logger = new Logger(SlackNotificationProvider.name);
  
  constructor(private configService: ConfigService) {}
  
  /**
   * Slack通知が設定されているかチェック
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('SLACK_WEBHOOK_URL');
  }
  
  /**
   * Slack通知を送信
   * @param recipients 通知チャンネル（この実装では使用しない）
   * @param payload 通知の内容
   */
  async send(recipients: string[], payload: NotificationPayload): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('Slackプロバイダーが設定されていないため、通知を送信できません');
      return false;
    }
    
    try {
      const webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
      
      // Slackメッセージの構築
      const slackPayload = {
        text: `*${payload.subject}*`, // フォールバック用テキスト
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: payload.subject,
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: payload.message
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*重要度:* ${this.getSeverityEmoji(payload.severity)} ${this.getSeverityLabel(payload.severity)}`
              },
              {
                type: 'mrkdwn',
                text: `*時刻:* <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time}|${new Date().toLocaleString('ja-JP')}>`
              }
            ]
          }
        ]
      };
      
      // HTTPS APIを使用してPOSTリクエスト
      return new Promise((resolve, reject) => {
        // 開発中はシミュレーションのみ
        this.logger.log(`Slack通知をシミュレート: "${payload.subject}" をSlackに送信`);
        this.logger.verbose(`Slackメッセージ: ${JSON.stringify(slackPayload)}`);
        
        // 実際の実装では以下のコードを使用
        /* 
        const url = new URL(webhookUrl);
        const data = JSON.stringify(slackPayload);
        
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        };
        
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              this.logger.log(`Slackに "${payload.subject}" の通知を送信しました`);
              resolve(true);
            } else {
              reject(new Error(`Slack API returned ${res.statusCode}: ${responseData}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.write(data);
        req.end();
        */
        
        // 開発中は常に成功を返す
        resolve(true);
      });
    } catch (error) {
      this.logger.error(`Slack通知エラー: ${error.message}`, error.stack);
      return false;
    }
  }
  
  /**
   * 重要度に対応する絵文字を取得
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
  
  /**
   * 重要度の日本語ラベルを取得
   */
  private getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '不明';
    }
  }
}