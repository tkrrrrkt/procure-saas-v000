// src/common/notifications/notifications.module.ts

import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './services/notification.service';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SlackNotificationProvider } from './providers/slack-notification.provider';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';
import { PrismaService } from '../../core/database/prisma.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    NotificationService,
    EmailNotificationProvider,
    SlackNotificationProvider,
    InAppNotificationProvider,
    PrismaService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    private notificationService: NotificationService,
    private emailProvider: EmailNotificationProvider,
    private slackProvider: SlackNotificationProvider,
    private inAppProvider: InAppNotificationProvider,
  ) {}
  
  /**
   * モジュール初期化時にプロバイダーを登録
   */
  onModuleInit() {
    // すべてのプロバイダーを通知サービスに登録
    this.notificationService.registerProvider(this.emailProvider);
    this.notificationService.registerProvider(this.slackProvider);
    this.notificationService.registerProvider(this.inAppProvider);
  }
}