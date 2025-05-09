// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';

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

// Redisモジュールとその他の条件付きモジュール
import { RedisModule } from './core/redis/redis.module';
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
    CommonModule,
    ConfigModule,
    AuthModule,
    DatabaseModule,
    UtilsModule,
    FiltersModule,
    UsersModule,
    HealthCheckModule,
    CsrfModule,
    ThrottlerModule,
    AuditLogModule,
    RedisModule,
    ...(HttpModule ? [HttpModule] : []),
    ...(ScheduleModule ? [ScheduleModule.forRoot()] : []),
    NotificationsModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // デバッグログ
    console.log('==== CSRF保護ミドルウェアを設定しています ====');
    
    // CSRFミドルウェアをすべての状態変更リクエストに適用
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        // 'api/'プレフィックスを削除（重複を避ける）
        { path: 'csrf/token', method: RequestMethod.GET },
        { path: 'health-check*', method: RequestMethod.GET },
        { path: 'api-docs*', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: '(.*)', method: RequestMethod.GET }
      )
      .forRoutes(
        // 'api/'プレフィックスを削除（重複を避ける）
        { path: '*', method: RequestMethod.POST },
        { path: '*', method: RequestMethod.PUT },
        { path: '*', method: RequestMethod.PATCH },
        { path: '*', method: RequestMethod.DELETE }
      );
  }
}