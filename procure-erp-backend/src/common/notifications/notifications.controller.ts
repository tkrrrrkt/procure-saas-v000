// src/common/notifications/notifications.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// テスト用DTOクラス
class SendNotificationDto {
  recipients: string[];
  subject: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  providerIds?: string[];
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Post('test')
  @ApiOperation({ summary: '通知テスト', description: '指定した受信者に通知を送信します (開発環境のみ)' })
  async testNotification(@Body() dto: SendNotificationDto) {
    const availableProviders = this.notificationService.getConfiguredProviders();
    const providerIds = dto.providerIds || availableProviders;
    
    const results = await this.notificationService.sendNotification(
      providerIds,
      dto.recipients,
      {
        subject: dto.subject,
        message: dto.message,
        severity: dto.severity,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        }
      }
    );
    
    return {
      success: true,
      message: '通知テストを実行しました',
      providerResults: results,
      configuredProviders: availableProviders
    };
  }

  @Post('providers')
  @ApiOperation({ summary: '利用可能な通知プロバイダー一覧', description: '現在設定されている通知プロバイダーの一覧を取得します' })
  getConfiguredProviders() {
    return {
      providers: this.notificationService.getAllProviders()
    };
  }
}