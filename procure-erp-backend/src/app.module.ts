// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';   // ← 自作 ConfigModule を import

// 機能モジュール
import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { UtilsModule } from './shared/utils/utils.module';
import { FiltersModule } from './shared/filters/filters.module';
import { UsersModule } from './modules/users/users.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CsrfModule } from './common/csrf/csrf.module';
import { ThrottlerModule } from './common/throttler/throttler.module';

// 監査ログ機能のインポート
import { AuditLogModule } from './common/audit/audit-log.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

// 通知とセキュリティモジュールのインポート
import { NotificationsModule } from './common/notifications/notifications.module';
import { SecurityModule } from './common/security/security.module';

// 条件付きでHttpModuleとScheduleModuleをインポート
let HttpModule;
let ScheduleModule;
try {
  const { HttpModule: ImportedHttpModule } = require('@nestjs/axios');
  HttpModule = ImportedHttpModule;
} catch (error) {
  console.warn('警告: @nestjs/axios モジュールが見つかりません。HTTP機能は制限されます。');
}

try {
  const { ScheduleModule: ImportedScheduleModule } = require('@nestjs/schedule');
  ScheduleModule = ImportedScheduleModule;
} catch (error) {
  console.warn('警告: @nestjs/schedule モジュールが見つかりません。スケジュール機能は無効になります。');
}

@Module({
  imports: [
    CommonModule,          // Interceptor & Filter
    ConfigModule,          // ← forRoot() 呼び出しは不要
    AuthModule,
    DatabaseModule,
    UtilsModule,
    FiltersModule,
    UsersModule,
    HealthCheckModule,
    CsrfModule,           // CSRFモジュール
    ThrottlerModule,      // レート制限モジュール
    AuditLogModule,       // 監査ログモジュール
    ...(HttpModule ? [HttpModule] : []),  // HttpModuleが存在する場合のみ追加
    ...(ScheduleModule ? [ScheduleModule.forRoot()] : []),  // ScheduleModuleが存在する場合のみ追加
    NotificationsModule,  // 新規：通知モジュール
    SecurityModule,       // 新規：セキュリティモジュール
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 監査ログインターセプターをグローバルに適用
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // すべてのAPIパスに対してCSRFミドルウェアを適用
    consumer
      .apply(CsrfMiddleware)
      .forRoutes({ path: 'auth/*', method: RequestMethod.ALL });  // 特定のパスだけに適用
  }
}