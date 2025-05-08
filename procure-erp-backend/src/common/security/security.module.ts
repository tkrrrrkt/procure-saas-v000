// src/common/security/security.module.ts

import { Module } from '@nestjs/common';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../../core/database/prisma.service';

// スケジューリングが必要な場合のみインポート
let ScheduleModule;
try {
  const { ScheduleModule: ImportedScheduleModule } = require('@nestjs/schedule');
  ScheduleModule = ImportedScheduleModule;
} catch (error) {
  console.warn('警告: @nestjs/schedule モジュールが見つかりません。スケジュール機能は無効になります。');
}

@Module({
  imports: [
    // スケジュールモジュールが存在する場合のみ追加
    ...(ScheduleModule ? [ScheduleModule.forRoot()] : []),
    NotificationsModule,
  ],
  providers: [
    AnomalyDetectionService,
    PrismaService,
  ],
  exports: [AnomalyDetectionService],
})
export class SecurityModule {}