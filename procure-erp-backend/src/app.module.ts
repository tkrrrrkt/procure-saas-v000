import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule }  from './common/common.module';
import { ConfigModule }  from './config/config.module';   // ← 自作 ConfigModule を import

// 機能モジュール
import { AuthModule }    from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { UtilsModule }    from './shared/utils/utils.module';
import { FiltersModule }  from './shared/filters/filters.module';
import { UsersModule }    from './modules/users/users.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CsrfModule } from './common/csrf/csrf.module';
import { ThrottlerModule } from './common/throttler/throttler.module';

// 監査ログ機能のインポート
import { AuditLogModule } from './common/audit/audit-log.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

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